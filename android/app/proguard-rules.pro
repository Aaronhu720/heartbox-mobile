# Capacitor - keep WebView JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Capacitor plugin classes
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.** { *; }

# Keep AndroidX classes used by Capacitor
-keep class androidx.core.** { *; }
-keep class androidx.appcompat.** { *; }
-keep class androidx.coordinatorlayout.** { *; }

# Keep splash screen
-keep class androidx.core.splashscreen.** { *; }

# Don't warn about missing classes
-dontwarn org.apache.http.**
-dontwarn android.net.http.**
-dontwarn com.google.android.gms.**

# Keep annotations
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes InnerClasses
