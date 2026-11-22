package com.worldpeace.committee;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;
import org.json.JSONObject;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Offline game wrapper. WebView loads only bundled game assets. */
public final class MainActivity extends Activity {
    private static final String HOME = "https://appassets.androidplatform.net/assets/game/index.html";
    private static final int IMPORT = 41, EXPORT = 42, MAX_BYTES = 500000;
    private WebView web;
    private TextView loading;
    private SharedPreferences saves;
    private final ExecutorService files = Executors.newSingleThreadExecutor();
    private final ArrayList<String> waiting = new ArrayList<>();
    private boolean ready, filePickerOpen;
    private FrameLayout gameFrame;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        filePickerOpen = state != null && state.getBoolean("filePickerOpen");
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        immersive();
        showGame();
    }

    private void showGame() {
        saves=getSharedPreferences("peace-committee-v1",MODE_PRIVATE);
        FrameLayout frame = new FrameLayout(this);
        gameFrame=frame;
        frame.setBackgroundColor(0xff142435);
        web = new WebView(this);
        web.setBackgroundColor(0xff142435);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setTextZoom(100); // The game provides tested, explicit font-size settings.
        web.setWebChromeClient(new WebChromeClient());
        web.addJavascriptInterface(new Bridge(), "PeaceAndroid");
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !HOME.equals(request.getUrl().toString());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return !HOME.equals(url);
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String path = uri.getPath();
                if (!"GET".equals(request.getMethod()) || !"https".equals(uri.getScheme()) ||
                    !"appassets.androidplatform.net".equals(uri.getHost()) || uri.getPort() != -1 ||
                    path == null || !path.startsWith("/assets/game/") || path.contains("..") || path.contains("\\")) return missing();
                try {
                    InputStream stream = getAssets().open(path.substring("/assets/".length()));
                    HashMap<String,String> headers = new HashMap<>();
                    headers.put("Content-Security-Policy", "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'");
                    headers.put("X-Content-Type-Options", "nosniff");
                    return new WebResourceResponse(mime(path), "UTF-8", 200, "OK", headers, stream);
                } catch (Exception error) { return missing(); }
            }
            @Override public void onPageFinished(WebView view, String url) {
                view.postDelayed(() -> {
                    if (!ready && !isFinishing()) loading.setText("游戏未能启动\n请更新 Android System WebView 后重试。\n点击这里重新加载");
                }, 8000);
            }
        });
        frame.addView(web, new FrameLayout.LayoutParams(-1, -1));
        loading = new TextView(this);
        loading.setText("世界和平委员会\n正在准备七国档案…");
        loading.setTextColor(0xffd8b97a);
        loading.setTextSize(22);
        loading.setGravity(Gravity.CENTER);
        loading.setBackgroundColor(0xff142435);
        loading.setOnClickListener(v -> { if (!ready) web.reload(); });
        frame.addView(loading, new FrameLayout.LayoutParams(-1, -1));
        setContentView(frame);
        immersive();
        web.loadUrl(HOME);
    }

    private static String mime(String path) {
        String p = path.toLowerCase(Locale.ROOT);
        if(p.endsWith(".html")) return "text/html";
        if(p.endsWith(".js")) return "text/javascript";
        if(p.endsWith(".css")) return "text/css";
        if(p.endsWith(".svg")) return "image/svg+xml";
        if(p.endsWith(".png")) return "image/png";
        return "application/octet-stream";
    }
    private static WebResourceResponse missing() {
        return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", new HashMap<>(), new ByteArrayInputStream(new byte[0]));
    }
    private void immersive() {
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    }
    @Override public void onWindowFocusChanged(boolean focused) { super.onWindowFocusChanged(focused); if(focused) immersive(); }
    @Override public void onBackPressed() {
        if(ready) web.evaluateJavascript("window.PeaceMobile.back()", null); else confirmExit();
    }
    @Override protected void onPause() {
        if(web != null) {
            if(ready) web.evaluateJavascript("window.PeaceMobile.pause()", null);
            web.onPause();
        }
        super.onPause();
    }
    @Override protected void onResume() { super.onResume(); if(web != null) web.onResume(); immersive(); }
    @Override protected void onSaveInstanceState(Bundle out) {
        out.putBoolean("filePickerOpen", filePickerOpen);
        super.onSaveInstanceState(out);
    }
    @Override protected void onDestroy() {
        disposeGame();
        files.shutdown();
        super.onDestroy();
    }
    private void disposeGame() {
        if(web==null)return;
        web.removeJavascriptInterface("PeaceAndroid");
        if(web.getParent() instanceof android.view.ViewGroup)((android.view.ViewGroup)web.getParent()).removeView(web);
        web.destroy();web=null;gameFrame=null;ready=false;
    }
    private void confirmExit() {
        AlertDialog.Builder dialog=new AlertDialog.Builder(this).setTitle("离开游戏？").setMessage("已保存的任期会保留，下次可从主菜单继续。")
            .setNegativeButton("留在这里", null).setPositiveButton("退出应用", (d,w) -> finish());
        dialog.show();
    }
    private void flushMessages(){if(!ready)return;for(String script:waiting)web.evaluateJavascript(script,null);waiting.clear();}
    private void deliver(String kind, String text) {
        String script = "window.PeaceMobile.receive(" + JSONObject.quote(kind) + "," + JSONObject.quote(text) + ")";
        runOnUiThread(() -> {
            if(isFinishing() || isDestroyed()) return;
            if(ready) web.evaluateJavascript(script, null); else waiting.add(script);
        });
    }
    private boolean validKey(String key) {
        return key != null && key.matches("peace-committee-(save|preferences|slot-(1|2|3|backup))-v1");
    }
    public final class Bridge {
        @JavascriptInterface public String getItem(String key) {
            try {
                if(!validKey(key)) throw new IllegalArgumentException();
                String value = saves.getString(key, null);
                return new JSONObject().put("ok", true).put("value", value == null ? JSONObject.NULL : value).toString();
            } catch(Exception error) { return "{\"ok\":false}"; }
        }
        @JavascriptInterface public boolean setItem(String key, String value) {
            if(!validKey(key) || value == null || value.getBytes(StandardCharsets.UTF_8).length > MAX_BYTES) return false;
            try { return saves.edit().putString(key, value).commit(); } catch(Exception error) { return false; }
        }
        @JavascriptInterface public boolean canVibrate() {
            Vibrator v = (Vibrator)getSystemService(VIBRATOR_SERVICE); return v != null && v.hasVibrator();
        }
        @JavascriptInterface public void vibrate() {
            Vibrator v = (Vibrator)getSystemService(VIBRATOR_SERVICE);
            if(v != null && v.hasVibrator()) v.vibrate(VibrationEffect.createOneShot(12, VibrationEffect.DEFAULT_AMPLITUDE));
        }
        @JavascriptInterface public void ready() {
            runOnUiThread(() -> {
                ready = true; loading.setVisibility(View.GONE);
                flushMessages();
            });
        }
        @JavascriptInterface public void requestExit() { runOnUiThread(() -> confirmExit()); }
        @JavascriptInterface public void importSave() {
            runOnUiThread(() -> {
                if(filePickerOpen) return;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");
                try { filePickerOpen = true; startActivityForResult(intent, IMPORT); }
                catch(Exception error) { filePickerOpen = false; deliver("error", "无法打开系统文件选择器。"); }
            });
        }
        @JavascriptInterface public void exportSave(String name, String json) {
            if(json == null || json.getBytes(StandardCharsets.UTF_8).length > MAX_BYTES) { deliver("error", "存档文件过大。"); return; }
            runOnUiThread(() -> {
                if(filePickerOpen) return;
                filePickerOpen = true;
                files.execute(() -> {
                    try {
                        try(OutputStream out = new FileOutputStream(new File(getFilesDir(), "pending-export.json"))) { out.write(json.getBytes(StandardCharsets.UTF_8)); }
                        runOnUiThread(() -> {
                            try {
                                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("application/json");
                                intent.putExtra(Intent.EXTRA_TITLE, name == null ? "world-peace-save.json" : name.replaceAll("[/\\\\]", "_"));
                                startActivityForResult(intent, EXPORT);
                            } catch(Exception error) { filePickerOpen = false; deliver("error", "无法打开系统保存对话框。"); }
                        });
                    } catch(Exception error) { runOnUiThread(() -> filePickerOpen = false); deliver("error", "无法准备导出文件，游戏存档仍然保留。"); }
                });
            });
        }
    }
    private byte[] readLimited(InputStream input) throws Exception {
        if(input == null) throw new Exception("无法打开文件");
        try(InputStream in = input; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192]; int n;
            while((n = in.read(buffer)) != -1) { if(out.size() + n > MAX_BYTES) throw new Exception("存档不能超过 500 KB"); out.write(buffer, 0, n); }
            return out.toByteArray();
        }
    }
    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if(request != IMPORT && request != EXPORT) return;
        if(result != RESULT_OK || data == null || data.getData() == null) {
            filePickerOpen = false;
            if(request == EXPORT) new File(getFilesDir(), "pending-export.json").delete();
            return;
        }
        Uri uri = data.getData();
        files.execute(() -> {
            try {
                if(request == IMPORT) deliver("import", new String(readLimited(getContentResolver().openInputStream(uri)), StandardCharsets.UTF_8));
                else {
                    byte[] bytes = readLimited(new FileInputStream(new File(getFilesDir(), "pending-export.json")));
                    try(OutputStream out = getContentResolver().openOutputStream(uri, "wt")) {
                        if(out == null) throw new Exception("无法写入文件"); out.write(bytes); out.flush();
                    }
                    deliver("notice", "存档已导出，可在网页版或安卓安装版中导入。");
                }
            } catch(Exception error) { deliver("error", "文件读写失败，请重试。原游戏进度未被替换。"); }
            finally { if(request == EXPORT) new File(getFilesDir(), "pending-export.json").delete(); runOnUiThread(() -> filePickerOpen = false); }
        });
    }
}
