const { emitPosChange } = require("../utils/realtime");
const { PaymentConfig } = require("../models");
const fs = require("fs");
const path = require("path");

const DEFAULT_PAYMENT_CONFIG = {
  bankName: "",
  accountTitle: "",
  accountNumber: "",
  iban: "",
  easypaisaNumber: "",
  easypaisaAccountName: "",
  bankQrImageUrl: "",
  easypaisaQrImageUrl: "",
  showBankOnReceipt: true,
  showEasypaisaOnReceipt: true,
};

const parseBool = (value, fallback = true) => {
  if (value === undefined || value === null) return fallback;
  return value !== false && value !== "false";
};

const formatPaymentConfig = (row) => {
  const legacyShow = row.showOnReceipt !== false;
  return {
    id: String(row._id),
    bankName: row.bankName || "",
    accountTitle: row.accountTitle || "",
    accountNumber: row.accountNumber || "",
    iban: row.iban || "",
    easypaisaNumber: row.easypaisaNumber || "",
    easypaisaAccountName: row.easypaisaAccountName || "",
    bankQrImageUrl: row.bankQrImageUrl || "",
    easypaisaQrImageUrl: row.easypaisaQrImageUrl || "",
    showBankOnReceipt: row.showBankOnReceipt !== undefined ? row.showBankOnReceipt !== false : legacyShow,
    showEasypaisaOnReceipt: row.showEasypaisaOnReceipt !== undefined ? row.showEasypaisaOnReceipt !== false : legacyShow,
  };
};

exports.get = async (_req, res) => {
  let row = await PaymentConfig.findOne({});
  if (!row) row = await PaymentConfig.create(DEFAULT_PAYMENT_CONFIG);
  res.json(formatPaymentConfig(row));
};

exports.put = async (req, res) => {
  const body = req.body || {};
  const patch = {
    bankName: String(body.bankName ?? "").trim(),
    accountTitle: String(body.accountTitle ?? "").trim(),
    accountNumber: String(body.accountNumber ?? "").trim(),
    iban: String(body.iban ?? "").trim(),
    easypaisaNumber: String(body.easypaisaNumber ?? "").trim(),
    easypaisaAccountName: String(body.easypaisaAccountName ?? "").trim(),
    showBankOnReceipt: parseBool(body.showBankOnReceipt, true),
    showEasypaisaOnReceipt: parseBool(body.showEasypaisaOnReceipt, true),
  };

  const existing = await PaymentConfig.findOne({});
  const row = existing
    ? await PaymentConfig.findByIdAndUpdate(existing._id, patch, { new: true })
    : await PaymentConfig.create({ ...DEFAULT_PAYMENT_CONFIG, ...patch });

  emitPosChange(["settings"]);
  res.json(formatPaymentConfig(row));
};

exports.uploadQr = async (req, res) => {
  const type = String(req.body?.type || req.query?.type || "").toLowerCase();
  if (!["bank", "easypaisa"].includes(type)) {
    return res.status(400).json({ message: "Provide type as bank or easypaisa." });
  }
  if (!req.file) {
    return res.status(400).json({ message: "Provide a QR image file." });
  }

  const field = type === "bank" ? "bankQrImageUrl" : "easypaisaQrImageUrl";
  const imageUrl = `/uploads/payment/${req.file.filename}`;

  const existing = await PaymentConfig.findOne({});
  const row = existing
    ? await PaymentConfig.findByIdAndUpdate(existing._id, { [field]: imageUrl }, { new: true })
    : await PaymentConfig.create({ ...DEFAULT_PAYMENT_CONFIG, [field]: imageUrl });

  emitPosChange(["settings"]);
  res.json(formatPaymentConfig(row));
};

exports.removeQr = async (req, res) => {
  const type = String(req.body?.type || req.query?.type || "").toLowerCase();
  if (!["bank", "easypaisa"].includes(type)) {
    return res.status(400).json({ message: "Provide type as bank or easypaisa." });
  }

  const field = type === "bank" ? "bankQrImageUrl" : "easypaisaQrImageUrl";
  const existing = await PaymentConfig.findOne({});
  if (!existing) {
    return res.json(formatPaymentConfig(await PaymentConfig.create(DEFAULT_PAYMENT_CONFIG)));
  }

  const currentUrl = existing[field] || "";
  if (currentUrl.startsWith("/uploads/payment/")) {
    const filePath = path.join(__dirname, "..", currentUrl.replace(/^\//, ""));
    fs.unlink(filePath, () => {});
  }

  const row = await PaymentConfig.findByIdAndUpdate(existing._id, { [field]: "" }, { new: true });
  emitPosChange(["settings"]);
  res.json(formatPaymentConfig(row));
};
