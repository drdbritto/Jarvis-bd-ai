JARVIS BD AI — OpenAI সংযুক্ত Android Project (v1.1)
===================================================

এই ZIP-এ Android app source এবং আলাদা secure Node.js backend আছে। এটি APK নয়। এই কাজের পরিবেশে Android SDK দিয়ে APK compile করা হয়নি।

এই সংস্করণে যুক্ত:
- OpenAI Responses API দিয়ে প্রকৃত AI text chat
- বাংলা/ইংরেজি প্রশ্নের উত্তর দেওয়ার system instruction
- শেষ ২৪টি message ফোনের localStorage-এ conversation context হিসেবে রাখা
- Android/browser Speech Recognition থাকলে বাংলা voice input
- ফোনের Text-to-Speech থাকলে উত্তর পড়ে শোনানো
- নারী/পুরুষ voice preference (ডিভাইসে থাকা voice অনুযায়ী best-effort)
- Backend URL ও App Access Code অ্যাপের Settings-এ সংরক্ষণ
- API key শুধু backend environment-এ থাকে; APK-তে রাখা হয় না
- GitHub Actions দিয়ে debug APK build workflow

সীমাবদ্ধতা:
- এই ZIP নিজে APK নয়; GitHub Actions দিয়ে APK build করতে হবে।
- OpenAI API key এবং API billing লাগবে। ChatGPT subscription API usage-এর খরচ অন্তর্ভুক্ত করে না।
- Backend deploy না করা পর্যন্ত AI chat কাজ করবে না।
- অ্যাপের বর্তমান মুখটি stylized placeholder; photorealistic 3D face, facial animation ও lip-sync এখনো যুক্ত হয়নি।
- নারী/পুরুষ বাংলা কণ্ঠের নিশ্চয়তা নেই; Android-এ বাংলা TTS voice installed থাকতে হবে। Voice নির্বাচন ডিভাইসের voice catalog-এর ওপর নির্ভর করে।
- Android WebView-এ speech recognition না চললে Chrome-এ web version পরীক্ষা করুন; APK-তে native speech plugin এখনো যুক্ত নয়।

A. OpenAI API Key তৈরি
----------------------
1. https://platform.openai.com/api-keys খুলুন।
2. একটি API key তৈরি করুন।
3. Key কাউকে পাঠাবেন না এবং GitHub-এ লিখবেন না।
4. API billing/credits সক্রিয় আছে কি না নিশ্চিত করুন। API usage-এর খরচ আলাদা।

B. Backend Deploy (Render উদাহরণ)
---------------------------------
1. এই ZIP extract করে সব ফাইল একটি নতুন GitHub repository-তে upload করুন।
2. https://dashboard.render.com/ খুলে New > Web Service নির্বাচন করুন এবং GitHub repository connect করুন।
3. Root Directory দিন: backend
4. Build Command: npm install
5. Start Command: npm start
6. Environment Variables-এ যোগ করুন:
   OPENAI_API_KEY = আপনার OpenAI secret key
   APP_ACCESS_CODE = নিজের তৈরি দীর্ঘ random code (কমপক্ষে ১২ অক্ষর)
   OPENAI_MODEL = gpt-5.5
   APP_ORIGINS = https://localhost,capacitor://localhost,http://localhost
7. Deploy শেষ হলে Render service-এর URL কপি করুন। যেমন https://your-service.onrender.com
8. URL/health খুলে {"ok":true,...} দেখাচ্ছে কি না পরীক্ষা করুন।

C. Android APK Build (GitHub Actions)
-------------------------------------
1. GitHub repository-তে .github/workflows/build-apk.yml ফাইলটি থাকতে হবে।
2. Actions tab খুলুন।
3. “Build JARVIS BD AI APK” workflow নির্বাচন করে Run workflow চাপুন।
4. Build সফল হলে run-এর Artifacts থেকে jarvis-bd-ai-debug-apk ডাউনলোড করুন।
5. ZIP extract করে app-debug.apk Android ফোনে নিন এবং install করুন।
6. Android Settings-এ এই APK install করার অনুমতি দিন, শুধু নিজের build-এর জন্য।

D. অ্যাপে Backend যুক্ত করা
--------------------------
1. JARVIS BD AI খুলুন।
2. “সার্ভার সেটিংস” খুলুন।
3. Backend URL-এ Render service URL দিন (শেষে slash দেবেন না)।
4. App Access Code-এ backend-এর APP_ACCESS_CODE দিন।
5. “সেটিংস সংরক্ষণ” চাপুন।
6. এখন text message পাঠিয়ে AI chat পরীক্ষা করুন।
7. Microphone চাপলে বাংলা voice input চেষ্টা করুন; ফোনে speech recognition permission দিন।

নিরাপত্তা
--------
- OPENAI_API_KEY কখনো Android app, HTML, APK, screenshot বা GitHub-এ রাখবেন না।
- APP_ACCESS_CODE-ও প্রকাশ করবেন না। এটি API key-এর বিকল্প নয়; শুধু app endpoint-এর একটি অতিরিক্ত shared access gate।
- Public app বিতরণ করলে user authentication, quotas, monitoring এবং abuse protection যোগ করতে হবে।
- এই backend প্রতি IP-তে rate limit করে; production deployment-এর আগে নিজের ব্যবহারের পরিমাণ অনুযায়ী সীমা পর্যালোচনা করুন।

ফোল্ডার:
www/       = Android app-এর web UI
backend/   = OpenAI API-তে নিরাপদ server-side সংযোগ
.github/   = Cloud APK build workflow
