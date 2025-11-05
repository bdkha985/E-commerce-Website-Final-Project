// worker.js
require("dotenv").config();
const Redis = require("ioredis");
const { sendWelcomeEmail } = require("./utils/mailer");

const redisClient = new Redis({
  host: "redis",
  port: 6379,
});

const QUEUE_NAME = "email_queue";

async function processEmailQueue() {
  console.log("✅ Worker đã khởi động, đang chờ email...");

  while (true) {
    try {

      const result = await redisClient.brpop(QUEUE_NAME, 0);
      
      const job = JSON.parse(result[1]);
      
      console.log(`[Worker] Nhận được email job cho: ${job.email}`);
      
      // Thực hiện gửi mail
      await sendWelcomeEmail(job.email, job.fullName);
      
      console.log(`[Worker] Đã gửi mail thành công cho: ${job.email}`);
      
    } catch (err) {
      console.error("[Worker] Lỗi khi xử lý hàng đợi:", err);
    }
  }
}

processEmailQueue();