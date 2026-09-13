import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import api from "../api/axios";

const emptyDetails = {
  merchant: "",
  amount: "",
  currency: "",
  transaction_date: "",
  transaction_time: "",
  reference_number: "",
  transaction_type: "payment",

  receipt_status: "",
  source_account: "",
  beneficiary_account: "",
  beneficiary_bank: "",
  beneficiary_remarks: "",
};

function ReceiptUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [receiptId, setReceiptId] = useState("");
  const [details, setDetails] = useState(emptyDetails);
  const [rawText, setRawText] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [processing, setProcessing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [extracted, setExtracted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const resetReceiptData = () => {
    setReceiptId("");
    setDetails(emptyDetails);
    setRawText("");
    setExtracted(false);
    setConfirmed(false);
    setAnalysisResult(null);
    setSuccess("");
  };

  const handleFile = (selectedFile) => {
    setError("");
    resetReceiptData();

    if (!selectedFile) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError(
        "Please upload a JPG, PNG, WEBP or PDF receipt."
      );
      return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      setError("File size must be below 10 MB.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(selectedFile);

    if (selectedFile.type.startsWith("image/")) {
      setPreviewUrl(
        URL.createObjectURL(selectedFile)
      );
    } else {
      setPreviewUrl("");
    }
  };

  const handleInputChange = (event) => {
    handleFile(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();

    handleFile(
      event.dataTransfer.files?.[0]
    );
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const removeFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(null);
    setPreviewUrl("");
    setError("");

    resetReceiptData();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExtract = async () => {
    if (!file) {
      return;
    }

    setProcessing(true);
    setError("");
    setSuccess("");
    setAnalysisResult(null);
    setConfirmed(false);

    try {
      const formData = new FormData();

      formData.append("file", file);

      const uploadResponse = await api.post(
        "/api/receipts/upload",
        formData
      );

      const newReceiptId =
        uploadResponse.data.receipt_id;

      setReceiptId(newReceiptId);

      const extractResponse = await api.post(
        `/api/receipts/${newReceiptId}/extract-details`
      );

      const extractedDetails =
        extractResponse.data.details;

      setDetails({
        merchant:
          extractedDetails.merchant || "",

        amount:
          extractedDetails.amount ?? "",

        currency:
          extractedDetails.currency || "",

        transaction_date:
          extractedDetails.transaction_date || "",

        transaction_time:
          extractedDetails.transaction_time || "",

        reference_number:
          extractedDetails.reference_number || "",

        transaction_type:
          extractedDetails.transaction_type ||
          "payment",

        receipt_status:
          extractedDetails.status || "",

        source_account:
          extractedDetails.source_account || "",

        beneficiary_account:
          extractedDetails.beneficiary_account || "",

        beneficiary_bank:
          extractedDetails.beneficiary_bank || "",

        beneficiary_remarks:
          extractedDetails.beneficiary_remarks || "",
      });

      setRawText(
        extractedDetails.raw_text || ""
      );

      setExtracted(true);

      setSuccess(
        "Receipt details extracted successfully. Review the information before confirming."
      );
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
        return;
      }

      setError(
        error.response?.data?.detail ||
          "Unable to process the receipt."
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleDetailChange = (event) => {
    const { name, value } = event.target;

    setDetails((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleConfirm = async () => {
    if (!receiptId) {
      setError("Receipt ID is missing.");
      return;
    }

    if (!details.amount || Number(details.amount) <= 0) {
      setError(
        "Please provide a valid transaction amount."
      );
      return;
    }

    setConfirming(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.post(
        `/api/receipts/${receiptId}/confirm`,
        {
          merchant:
            details.merchant.trim() || null,

          amount:
            Number(details.amount),

          currency:
            details.currency.trim() || null,

          transaction_type:
            details.transaction_type,

          transaction_date:
            details.transaction_date.trim() || null,

          transaction_time:
            details.transaction_time.trim() || null,

          reference_number:
            details.reference_number.trim() || null,

          receipt_status:
            details.receipt_status.trim() || null,

          source_account:
            details.source_account.trim() || null,

          beneficiary_account:
            details.beneficiary_account.trim() || null,

          beneficiary_bank:
            details.beneficiary_bank.trim() || null,

          beneficiary_remarks:
            details.beneficiary_remarks.trim() || null,

          raw_text:
            rawText || null,

          original_filename:
            file?.name || null,
        }
      );

      setAnalysisResult(response.data);
      setConfirmed(true);

      setSuccess(
        "Receipt confirmed, analysed and saved successfully."
      );
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
        return;
      }

      setError(
        error.response?.data?.detail ||
          "Unable to confirm the receipt."
      );
    } finally {
      setConfirming(false);
    }
  };

  const getRiskBadgeClass = (riskLevel) => {
    if (riskLevel === "high") {
      return "badge badge-danger";
    }

    if (riskLevel === "medium") {
      return "badge badge-warning";
    }

    return "badge badge-success";
  };

  return (
    <div className="page-container">
      <Navbar />

      <div className="page-header">
        <div>
          <p className="dashboard-eyebrow">
            Smart Receipt Processing
          </p>

          <h1>Upload E-Receipt</h1>

          <p>
            Upload an electronic receipt, extract its details
            automatically and analyse its transaction risk.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() =>
            navigate("/transactions")
          }
        >
          View Transactions
        </button>
      </div>

      <div className="receipt-layout">
        <div className="form-card">
          <div className="form-card-header">
            <h2>Receipt File</h2>

            <p>
              Upload a clear screenshot, image or PDF.
            </p>
          </div>

          <div
            className="receipt-drop-zone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() =>
              fileInputRef.current?.click()
            }
          >
            <div className="receipt-upload-icon">
              ↑
            </div>

            <h3>Drop your receipt here</h3>

            <p>or click to select a file</p>

            <span>
              JPG, PNG, WEBP or PDF · Maximum 10 MB
            </span>

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={handleInputChange}
              hidden
            />
          </div>

          {file && (
            <div className="uploaded-file-card">
              <div>
                <strong>{file.name}</strong>

                <p>
                  {(file.size / 1024 / 1024).toFixed(2)}
                  {" "}MB
                </p>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={(event) => {
                  event.stopPropagation();
                  removeFile();
                }}
              >
                Remove
              </button>
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              disabled={!file || processing}
              onClick={handleExtract}
            >
              {processing
                ? "Reading Receipt..."
                : "Extract Receipt Details"}
            </button>
          </div>
        </div>

        <div className="form-card receipt-preview-card">
          <div className="form-card-header">
            <h2>Receipt Preview</h2>

            <p>
              Confirm that the uploaded receipt is readable.
            </p>
          </div>

          {!file ? (
            <div className="receipt-empty-preview">
              <div className="receipt-preview-icon">
                ▧
              </div>

              <h3>No receipt selected</h3>

              <p>
                Your receipt preview will appear here.
              </p>
            </div>
          ) : previewUrl ? (
            <div className="receipt-image-wrapper">
              <img
                src={previewUrl}
                alt="Uploaded receipt"
              />
            </div>
          ) : (
            <div className="receipt-empty-preview">
              <div className="receipt-preview-icon">
                PDF
              </div>

              <h3>PDF Receipt Selected</h3>

              <p>{file.name}</p>
            </div>
          )}
        </div>
      </div>

      {extracted && (
        <div className="form-card">
          <div className="form-card-header">
            <p className="dashboard-eyebrow">
              OCR Extraction
            </p>

            <h2>Extracted Transaction Details</h2>

            <p>
              Review and edit any incorrect information before
              confirming the receipt.
            </p>
          </div>

          <div className="receipt-details-grid">
            <div className="form-group">
              <label>Merchant / Payee</label>

              <input
                name="merchant"
                value={details.merchant}
                onChange={handleDetailChange}
                placeholder="Not available on this receipt"
              />
            </div>

            <div className="form-group">
              <label>Amount</label>

              <input
                type="number"
                step="0.01"
                min="0"
                name="amount"
                value={details.amount}
                onChange={handleDetailChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Currency</label>

              <input
                name="currency"
                value={details.currency}
                onChange={handleDetailChange}
                placeholder="LKR"
              />
            </div>

            <div className="form-group">
              <label>Transaction Type</label>

              <select
                name="transaction_type"
                value={details.transaction_type}
                onChange={handleDetailChange}
              >
                <option value="payment">
                  Payment
                </option>

                <option value="purchase">
                  Purchase
                </option>

                <option value="transfer">
                  Transfer
                </option>

                <option value="withdrawal">
                  Withdrawal
                </option>

                <option value="deposit">
                  Deposit
                </option>
              </select>
            </div>

            <div className="form-group">
              <label>Receipt Status</label>

              <input
                name="receipt_status"
                value={details.receipt_status}
                onChange={handleDetailChange}
                placeholder="success"
              />
            </div>

            <div className="form-group">
              <label>Date</label>

              <input
                name="transaction_date"
                value={details.transaction_date}
                onChange={handleDetailChange}
              />
            </div>

            <div className="form-group">
              <label>Time</label>

              <input
                name="transaction_time"
                value={details.transaction_time}
                onChange={handleDetailChange}
              />
            </div>

            <div className="form-group">
              <label>Reference / Transaction ID</label>

              <input
                name="reference_number"
                value={details.reference_number}
                onChange={handleDetailChange}
              />
            </div>

            <div className="form-group">
              <label>Source Account</label>

              <input
                name="source_account"
                value={details.source_account}
                onChange={handleDetailChange}
              />
            </div>

            <div className="form-group">
              <label>Beneficiary Account</label>

              <input
                name="beneficiary_account"
                value={details.beneficiary_account}
                onChange={handleDetailChange}
              />
            </div>

            <div className="form-group">
              <label>Beneficiary Bank</label>

              <input
                name="beneficiary_bank"
                value={details.beneficiary_bank}
                onChange={handleDetailChange}
              />
            </div>

            <div className="form-group">
              <label>Beneficiary Remarks</label>

              <input
                name="beneficiary_remarks"
                value={details.beneficiary_remarks}
                onChange={handleDetailChange}
              />
            </div>
          </div>

          {receiptId && (
            <p className="receipt-system-id">
              System Receipt ID:{" "}
              <strong>{receiptId}</strong>
            </p>
          )}

          <details className="ocr-details">
            <summary>
              View raw OCR text
            </summary>

            <pre>{rawText}</pre>
          </details>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={
                confirming ||
                confirmed ||
                !details.amount
              }
            >
              {confirmed
                ? "Confirmed"
                : confirming
                  ? "Analysing..."
                  : "Confirm & Analyse"}
            </button>
          </div>
        </div>
      )}

      {analysisResult && (
        <div
          className={
            analysisResult.analysis.risk_level === "high"
              ? "prediction-result prediction-danger"
              : "prediction-result prediction-success"
          }
        >
          <div className="prediction-result-header">
            <div>
              <p className="dashboard-eyebrow">
                Receipt Risk Analysis
              </p>

              <h2>
                Transaction Analysis Complete
              </h2>
            </div>

            <span
              className={getRiskBadgeClass(
                analysisResult.analysis.risk_level
              )}
            >
              {analysisResult.analysis.risk_level}
            </span>
          </div>

          <div className="prediction-grid">
            <div>
              <span>Transaction ID</span>

              <strong>
                #{analysisResult.transaction.id}
              </strong>
            </div>

            <div>
              <span>Amount</span>

              <strong>
                {Number(
                  analysisResult.transaction.amount
                ).toFixed(2)}
              </strong>
            </div>

            <div>
              <span>Risk Score</span>

              <strong>
                {analysisResult.analysis.risk_score}/100
              </strong>
            </div>

            <div>
              <span>Risk Level</span>

              <strong>
                {analysisResult.analysis.risk_level}
              </strong>
            </div>

            <div>
              <span>Reference</span>

              <strong>
                {analysisResult.receipt.reference_number ||
                  "N/A"}
              </strong>
            </div>

            <div>
              <span>Duplicate Reference</span>

              <strong>
                {analysisResult.analysis.duplicate_reference
                  ? "Yes"
                  : "No"}
              </strong>
            </div>
          </div>

          <div className="risk-reasons">
            <h3>Analysis Reasons</h3>

            <ul>
              {analysisResult.analysis.risk_reasons.map(
                (reason, index) => (
                  <li key={index}>
                    {reason}
                  </li>
                )
              )}
            </ul>
          </div>

          <div className="form-actions">
            <button
              onClick={() =>
                navigate("/transactions")
              }
            >
              View Transaction History
            </button>

            <button
              className="secondary-button"
              onClick={() =>
                navigate("/fraud-alerts")
              }
            >
              View Fraud Alerts
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReceiptUpload;