const express = require("express");
const path = require("path");
const Groq = require("groq-sdk");
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } = require("firebase/firestore");

const app = express();
app.use(express.json());

// 明确指定静态网页托管目录
app.use(express.static(path.join(__dirname)));

const firebaseConfig = { projectId: "kefuxitong-89c18" };
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const GROQ_API_KEY = "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";
const groq = new Groq({ apiKey: GROQ_API_KEY });

// 登录验证接口
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "123456") {
    return res.json({ success: true, token: "lumina_secure_token_888" });
  }
  return res.status(401).json({ success: false, message: "用户名或密码错误" });
});

// 询盘处理与意向分析 API
app.post("/api/chat", async (req, res) => {
  try {
    const { customerId, customerMessage, targetKeywords, targetCountry } = req.body;
    if (!customerMessage) return res.status(400).json({ error: "消息不能为空" });

    const currentId = customerId || "web_guest_" + Math.floor(Math.random()*1000);
    const modelsList = await groq.models.list();
    const validModel = modelsList.data.find(m => !m.id.includes("whisper") && !m.id.includes("embed") && !m.id.includes("audio"));
    const activeModel = validModel ? validModel.id : "allam-2-7b";

    const systemPrompt = `你是一个专业的跨境智能客服助手。
当前系统设定的获客目标：
- 目标关键词过滤要求: ${targetKeywords || "无特定限制，关注价格/MOQ/批发"}
- 目标国家/地区: ${targetCountry || "全球 / 迪拜 / 美国"}

业务规矩：
1. 识别客户意向等级：
   - A级：包含目标关键词或询问价格、起订量(MOQ)、运费、采购下单（高意向）
   - B级：询材质、规格、款式、样品（中意向）
   - C级：闲聊或无关提问（低意向）
2. 用客户的语言专业回复。
严格输出 JSON 格式：{"intent":"A/B/C","reply":"你的专业回复"}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: customerMessage }
      ],
      model: activeModel,
      response_format: { type: "json_object" },
      temperature: 0.2
    });

    const aiResult = JSON.parse(completion.choices[0].message.content);
    
    const docRef = await addDoc(collection(db, "customer_inquiries"), {
      customerId: currentId,
      customerMessage: customerMessage,
      intent: aiResult.intent,
      aiReply: aiResult.reply,
      targetCountry: targetCountry || "Not Specified",
      targetKeywords: targetKeywords || "Default",
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, intent: aiResult.intent, reply: aiResult.reply, recordId: docRef.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取历史数据 API
app.get("/api/history", async (req, res) => {
  try {
    const q = query(collection(db, "customer_inquiries"), orderBy("createdAt", "desc"), limit(20));
    const querySnapshot = await getDocs(q);
    const list = [];
    querySnapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
    res.json({ success: true, list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 服务已成功运行在 http://localhost:${PORT}`));
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// 解析 JSON 请求体
app.use(express.json());

// 1. 根目录欢迎页（解决 Cannot GET /）
app.get('/', (req, res) => {
  res.send('Lumina AI Lead Qualification System is Running! 🚀');
});

// 2. 测试接口（解决 /test 打不开的问题）
app.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Test route is working perfectly!',
    timestamp: new Date().toISOString()
  });
});

// 启动服务监听端口
app.listen(port, () => {
  console.log(`🚀 服务已成功运行在端口 ${port}`);
});
