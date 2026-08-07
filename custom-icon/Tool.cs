using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;

namespace EchoMusicTool
{
    class Program
    {
        [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
        private static extern void SHChangeNotify(uint wEventId, uint uFlags, IntPtr dwItem1, IntPtr dwItem2);

        [DllImport("user32.dll")]
        private static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam, uint fuFlags, uint uTimeout, out IntPtr lpdwResult);

        [DllImport("kernel32.dll", CharSet = CharSet.Unicode)]
        private static extern uint QueryFullProcessImageName(IntPtr hProcess, uint dwFlags, StringBuilder lpExeName, ref uint lpdwSize);

        [DllImport("kernel32.dll")]
        private static extern IntPtr OpenProcess(uint processAccess, bool bInheritHandle, int processId);

        [DllImport("kernel32.dll")]
        private static extern bool CloseHandle(IntPtr hObject);

        private const uint PROCESS_QUERY_LIMITED_INFORMATION = 0x1000;
        private const uint SHCNE_ASSOCCHANGED = 0x08000000;
        private const uint SHCNF_IDLIST = 0x0000;
        private const uint SHCNF_FLUSH = 0x1000;
        private const uint HWND_BROADCAST = 0xFFFF;
        private const uint WM_SETTINGCHANGE = 0x001A;
        private const uint SMTO_ABORTIFHUNG = 0x0002;

        static int Main(string[] args)
        {
            if (args.Length == 0)
            {
                PrintUsage();
                return 1;
            }

            string mode = args[0].ToLower();
            switch (mode)
            {
                case "splash":
                    return RunSplash(args);
                case "shortcuts":
                    return RunShortcuts(args);
                case "delete":
                    return RunDelete(args);
                default:
                    PrintUsage();
                    return 1;
            }
        }

        static void PrintUsage()
        {
            Console.WriteLine("用法:");
            Console.WriteLine("  Tool.exe splash --image <图片路径> [--appDir <EchoMusic目录>]");
            Console.WriteLine("  Tool.exe shortcuts --mode <reset|custom> --appName <名称> [--iconPath <图标>] [--taskbarIconPath <图标>]");
        }

        // ==================== Splash ====================

        static int RunSplash(string[] args)
        {
            string imageSrc = null;
            string echoMusicDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "EchoMusic");

            for (int i = 1; i < args.Length; i++)
            {
                switch (args[i])
                {
                    case "--image": if (i + 1 < args.Length) imageSrc = args[++i]; break;
                    case "--appDir": if (i + 1 < args.Length) echoMusicDir = args[++i]; break;
                }
            }

            if (string.IsNullOrEmpty(imageSrc))
            {
                Console.WriteLine("ERROR: --image is required");
                return 1;
            }

            string asarPath = Path.Combine(echoMusicDir, "resources", "app.asar");
            string tmpDir = Path.Combine(echoMusicDir, "resources", "_splash_tmp");

            if (!File.Exists(asarPath)) { Console.WriteLine("ERROR: app.asar not found: " + asarPath); return 1; }
            if (!File.Exists(imageSrc)) { Console.WriteLine("ERROR: image not found: " + imageSrc); return 1; }
            if (!RunCmd("npx", "--version")) { Console.WriteLine("ERROR: npx not found, install Node.js"); return 1; }

            try
            {
                Console.WriteLine("[1/5] Extracting app.asar ...");
                if (Directory.Exists(tmpDir)) Directory.Delete(tmpDir, true);
                if (!RunCmd("npx", "asar extract \"" + asarPath + "\" \"" + tmpDir + "\""))
                { Console.WriteLine("ERROR: extract failed"); return 1; }

                Console.WriteLine("[2/5] Copying image ...");
                File.Copy(imageSrc, Path.Combine(tmpDir, "dist", "assets", "splash-custom.png"), true);

                Console.WriteLine("[3/5] Injecting splash script ...");
                string indexPath = Path.Combine(tmpDir, "dist", "index.html");
                string html = File.ReadAllText(indexPath, Encoding.UTF8);

                html = System.Text.RegularExpressions.Regex.Replace(html, "<script id=\"custom-splash-script\">.*?</script>", "", System.Text.RegularExpressions.RegexOptions.Singleline);

                string script =
                    "<script id=\"custom-splash-script\">" +
                    "(function(){" +
                    "var el=document.createElement('div');" +
                    "el.style.cssText='position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483647;background:url(./assets/splash-custom.png) center/cover no-repeat #000;pointer-events:none;transition:opacity .4s ease-out';" +
                    "(document.body||document.documentElement).appendChild(el);" +
                    "setTimeout(function(){el.style.opacity='0';setTimeout(function(){el.remove()},500)},2500);" +
                    "})();" +
                    "</script>";

                html = html.Replace("<body>", "<body>\n" + script);
                File.WriteAllText(indexPath, html, Encoding.UTF8);

                Console.WriteLine("[4/5] Backing up and repacking ...");
                File.Copy(asarPath, asarPath + ".bak", true);
                if (!RunCmd("npx", "asar pack \"" + tmpDir + "\" \"" + asarPath + "\""))
                { Console.WriteLine("ERROR: pack failed, restoring backup"); File.Copy(asarPath + ".bak", asarPath, true); return 1; }

                Console.WriteLine("[5/5] Cleanup ...");
                Directory.Delete(tmpDir, true);

                Console.WriteLine();
                Console.WriteLine("Done! Restart EchoMusic to apply.");
                Console.WriteLine("Backup: " + asarPath + ".bak");
                return 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine("ERROR: " + ex.Message);
                try { if (Directory.Exists(tmpDir)) Directory.Delete(tmpDir, true); } catch { }
                return 1;
            }
        }

        // ==================== Shortcuts ====================

        static string FindEchoMusicExe(string appName)
        {
            string lowerApp = appName + ".exe";
            try
            {
                Process[] all = Process.GetProcessesByName(appName);
                foreach (Process p in all)
                {
                    try
                    {
                        IntPtr hProc = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, p.Id);
                        if (hProc != IntPtr.Zero)
                        {
                            uint size = 1024;
                            StringBuilder sb = new StringBuilder((int)size);
                            if (QueryFullProcessImageName(hProc, 0, sb, ref size) != 0 && sb.Length > 0)
                            {
                                CloseHandle(hProc);
                                if (sb.ToString().ToLower().EndsWith(lowerApp)) return sb.ToString();
                            }
                            else CloseHandle(hProc);
                        }
                    }
                    catch { }
                }
            }
            catch { }

            string[] candidates = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", appName, appName + ".exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), appName, appName + ".exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), appName, appName + ".exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), appName, appName + ".exe"),
            };
            foreach (string candidate in candidates)
                try { if (File.Exists(candidate)) return candidate; } catch { }

            string[] desktops = new string[]
            {
                Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Desktop"),
            };
            foreach (string dir in desktops)
            {
                try
                {
                    if (!Directory.Exists(dir)) continue;
                    foreach (string f in Directory.GetFiles(dir, "*.lnk"))
                    {
                        try
                        {
                            Type wsh = Type.GetTypeFromProgID("WScript.Shell");
                            if (wsh == null) break;
                            object sh = Activator.CreateInstance(wsh);
                            dynamic sc = wsh.InvokeMember("CreateShortcut", BindingFlags.InvokeMethod, null, sh, new object[] { f });
                            string t = (sc.TargetPath ?? "").ToString();
                            if (!string.IsNullOrEmpty(t) && t.ToLower().EndsWith(lowerApp) && File.Exists(t))
                            { Marshal.ReleaseComObject(sc); Marshal.ReleaseComObject(sh); return t; }
                            Marshal.ReleaseComObject(sc); Marshal.ReleaseComObject(sh);
                        }
                        catch { }
                    }
                }
                catch { }
            }
            return null;
        }

        static void UpdateShortcutsInDir(Type wshType, string dir, string mode, string iconPath,
            string lowerAppName, string lowerAppExe, string exePath,
            ref int shortcutsFound, ref int shortcutsUpdated)
        {
            if (!Directory.Exists(dir)) return;
            string[] lnkFiles;
            try { lnkFiles = Directory.GetFiles(dir, "*.lnk"); } catch { return; }

            foreach (string lnkFile in lnkFiles)
            {
                try
                {
                    object shellInst = Activator.CreateInstance(wshType);
                    dynamic shortcut = wshType.InvokeMember("CreateShortcut", BindingFlags.InvokeMethod, null, shellInst, new object[] { lnkFile });
                    string target = (shortcut.TargetPath ?? "").ToString();
                    string name = Path.GetFileNameWithoutExtension(lnkFile);

                    bool isMatch = (!string.IsNullOrEmpty(target) && (target.ToLower().Contains(lowerAppName) || target.ToLower().Contains(lowerAppExe)))
                        || name.ToLower().Contains(lowerAppName) || name.ToLower().Contains(lowerAppExe);

                    if (!isMatch) { Marshal.ReleaseComObject(shortcut); Marshal.ReleaseComObject(shellInst); continue; }
                    shortcutsFound++;

                    if (mode == "reset")
                    {
                        string t = string.IsNullOrEmpty(target) || !File.Exists(target) ? exePath : target;
                        shortcut.IconLocation = (!string.IsNullOrEmpty(t) && File.Exists(t)) ? t + ",0" : "";
                    }
                    else if (mode == "custom")
                    {
                        if (!string.IsNullOrEmpty(iconPath) && File.Exists(iconPath))
                            shortcut.IconLocation = iconPath + ",0";
                        else { Marshal.ReleaseComObject(shortcut); Marshal.ReleaseComObject(shellInst); continue; }
                    }

                    shortcut.Save();
                    shortcutsUpdated++;
                    Marshal.ReleaseComObject(shortcut);
                    Marshal.ReleaseComObject(shellInst);
                }
                catch { }
            }
        }

        static int RunShortcuts(string[] args)
        {
            string mode = null, iconPath = null, taskbarIconPath = null, appName = "EchoMusic", exePath = null, desktopDir = null;

            for (int i = 1; i < args.Length; i++)
            {
                switch (args[i])
                {
                    case "--mode": if (i + 1 < args.Length) mode = args[++i]; break;
                    case "--iconPath": if (i + 1 < args.Length) iconPath = args[++i]; break;
                    case "--taskbarIconPath": if (i + 1 < args.Length) taskbarIconPath = args[++i]; break;
                    case "--appName": if (i + 1 < args.Length) appName = args[++i]; break;
                    case "--exePath": if (i + 1 < args.Length) exePath = args[++i]; break;
                    case "--desktopDir": if (i + 1 < args.Length) desktopDir = args[++i]; break;
                }
            }

            if (string.IsNullOrEmpty(mode)) { Console.WriteLine("ERROR: --mode is required"); return 1; }
            if (mode == "custom" && string.IsNullOrEmpty(iconPath) && string.IsNullOrEmpty(taskbarIconPath))
            { Console.WriteLine("ERROR: --iconPath or --taskbarIconPath required"); return 1; }

            string desktop = !string.IsNullOrEmpty(desktopDir) && Directory.Exists(desktopDir)
                ? desktopDir : Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);

            if (string.IsNullOrEmpty(exePath) || !File.Exists(exePath))
            {
                string found = FindEchoMusicExe(appName);
                if (!string.IsNullOrEmpty(found)) { exePath = found; Console.WriteLine("AUTO: " + exePath); }
            }

            Type wshType = Type.GetTypeFromProgID("WScript.Shell");
            if (wshType == null) { Console.WriteLine("ERROR: WScript.Shell not available"); return 1; }

            int shortcutsUpdated = 0, shortcutsFound = 0, shortcutsCreated = 0;
            string lowerAppName = appName.ToLower();
            string lowerAppExe = !string.IsNullOrEmpty(exePath) ? Path.GetFileNameWithoutExtension(exePath).ToLower() : lowerAppName;

            UpdateShortcutsInDir(wshType, desktop, mode, iconPath, lowerAppName, lowerAppExe, exePath, ref shortcutsFound, ref shortcutsUpdated);

            if (shortcutsFound == 0 && !string.IsNullOrEmpty(exePath) && File.Exists(exePath))
            {
                try
                {
                    string newLnk = Path.Combine(desktop, appName + ".lnk");
                    object shellInst = Activator.CreateInstance(wshType);
                    dynamic sc = wshType.InvokeMember("CreateShortcut", BindingFlags.InvokeMethod, null, shellInst, new object[] { newLnk });
                    sc.TargetPath = exePath;
                    sc.WorkingDirectory = Path.GetDirectoryName(exePath);
                    sc.WindowStyle = 1;
                    sc.Description = appName;
                    sc.IconLocation = (mode == "custom" && !string.IsNullOrEmpty(iconPath) && File.Exists(iconPath))
                        ? iconPath + ",0" : exePath + ",0";
                    sc.Save();
                    Marshal.ReleaseComObject(sc); Marshal.ReleaseComObject(shellInst);
                    shortcutsUpdated++; shortcutsCreated++;
                    Console.WriteLine("CREATED: " + newLnk);
                }
                catch (Exception ex) { Console.WriteLine("ERROR: " + ex.Message); }
            }

            string taskbarDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "Microsoft", "Internet Explorer", "Quick Launch", "User Pinned", "TaskBar");
            string useTaskbarIcon = (mode == "custom" && !string.IsNullOrEmpty(taskbarIconPath)) ? taskbarIconPath : iconPath;
            int taskbarFound = 0, taskbarUpdated = 0;

            if (!string.IsNullOrEmpty(useTaskbarIcon))
                UpdateShortcutsInDir(wshType, taskbarDir, mode, useTaskbarIcon, lowerAppName, lowerAppExe, exePath, ref taskbarFound, ref taskbarUpdated);
            else if (mode == "reset")
                UpdateShortcutsInDir(wshType, taskbarDir, mode, null, lowerAppName, lowerAppExe, exePath, ref taskbarFound, ref taskbarUpdated);

            shortcutsFound += taskbarFound; shortcutsUpdated += taskbarUpdated;

            try
            {
                SHChangeNotify(SHCNE_ASSOCCHANGED, SHCNF_IDLIST | SHCNF_FLUSH, IntPtr.Zero, IntPtr.Zero);
                IntPtr dummy;
                SendMessageTimeout(new IntPtr(HWND_BROADCAST), WM_SETTINGCHANGE, IntPtr.Zero, IntPtr.Zero, SMTO_ABORTIFHUNG, 2000, out dummy);
            }
            catch { }

            Console.WriteLine("MODE: " + mode);
            Console.WriteLine("FOUND: " + shortcutsFound);
            Console.WriteLine("UPDATED: " + shortcutsUpdated);
            Console.WriteLine("CREATED: " + shortcutsCreated);
            Console.WriteLine("TASKBAR_FOUND: " + taskbarFound);
            Console.WriteLine("TASKBAR_UPDATED: " + taskbarUpdated);
            return shortcutsUpdated > 0 ? 0 : 2;
        }

        static int RunDelete(string[] args)
        {
            string toolDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
            for (int i = 1; i < args.Length; i++)
            {
                string filePath = args[i];
                string fullPath = Path.IsPathRooted(filePath) ? filePath : Path.Combine(toolDir, filePath);
                try
                {
                    if (File.Exists(fullPath)) File.Delete(fullPath);
                }
                catch { }
            }
            return 0;
        }

        static bool RunCmd(string fileName, string arguments)
        {
            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = fileName,
                    Arguments = arguments,
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true,
                };
                using (var proc = Process.Start(psi))
                {
                    proc.StandardOutput.ReadToEnd();
                    proc.StandardError.ReadToEnd();
                    proc.WaitForExit();
                    return proc.ExitCode == 0;
                }
            }
            catch { return false; }
        }
    }
}
