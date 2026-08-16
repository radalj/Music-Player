# استفاده از نسخه سبک نود-جی‌اس
FROM node:18-alpine

# تنظیم پوشه کاری
WORKDIR /app

# کپی کردن فایل‌های پکیج و نصب وابستگی‌ها
COPY package.json package-lock.json* ./
RUN npm install

# کپی کردن کل کدهای فرانت‌اند
COPY . .

# باز کردن پورت 7000
EXPOSE 7000

# اجرای سرور با پورت 7000
CMD ["npm", "run", "dev", "--", "-p", "7000"]