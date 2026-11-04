const Groq = require("groq-sdk");
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc } = require("firebase/firestore");

// 1. Firebase 配置
const firebaseConfig = {
  projectId: "kefuxitong-89c18"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// 2. 初始化 Groq AI
const GROQ_API_KEY = "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";
const groq = new Groq({ apiKey: GROQ_API_KEY });

async function runCustomerServiceWorkflow() {
  try {
    console.log("正在动态获取可用 AI 模型...\n");
    const modelsList = await groq.models.list();
    
    // 智能筛选：过滤掉 whisper、embedding 以及需要特殊协议的模型，寻找真正的文本对话模型
    const validModel = modelsList.data.find(m => 
      !m.id.includes("whisper") && 
      !m.id.includes("embed") && 
      !m.id.includes("orpheus") &&
      !m.id.includes("audio")
    );

    const activeModel = validModel ? validModel.id : "llama3-70b-8192";
    console.log(`✅ AI 模型就绪: [ ${activeModel} ]`);

    const customerId = "whatsapp_971501234567";
    const customerMessage = "Hi, how much is the price and MOQ if I ship to Dubai?";
    console.log(`\n📩 收到客户 [${customerId}] 消息: "${customerMessage}"`);

    console.log("🤖 AI 正在分析意向并生成回复...");
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `你是一个专业的跨境智能客服。
1. 识别客户语言，使用和客户相同的语言回复。
2. 判断客户意向等级：
   - A级：询问价格、MOQ起订量、运费、下单相关（高意向）
   - B级：询问产品参数、规格、材质、样品（中意向）
   - C级：闲聊、无关提问、无效信息（低意向）
输出严格JSON，不要额外解释，模板：{"intent":"级别","reply":"你的回复"}`
        },
        { role: "user", content: customerMessage }
      ],
      model: activeModel,
      response_format: { type: "json_object" },
      temperature: 0.2
    });

    const aiResult = JSON.parse(completion.choices[0].message.content);
    console.log(`✨ AI 分析完成 -> 意向评级: [ ${aiResult.intent} ]`);
    console.log(`💬 AI 回复内容: ${aiResult.reply}`);

    console.log("\n💾 正在将数据同步至 Firestore 数据库...");
    const docRef = await addDoc(collection(db, "customer_inquiries"), {
      customerId: customerId,
      customerMessage: customerMessage,
      intent: aiResult.intent,
      aiReply: aiResult.reply,
      createdAt: new Date().toISOString()
    });

    console.log("==================================================");
    console.log(` 🎉 🎉 🎉 数据成功存入 Firestore！文档 ID: ${docRef.id} 🎉 🎉 🎉`);
    console.log("==================================================\n");

  } catch (error) {
    console.error("执行出错:", error.message || error);
  }
}

runCustomerServiceWorkflow();