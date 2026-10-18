import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
  Dialog,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

// QR + باركودات الأدوية الشائعة
const FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.CODABAR,
];

export default function QrScannerDialog({ open, onClose, onScan }) {
  const scannerRef = useRef(null);
  const handledRef = useRef(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState?.();
        // 2 = SCANNING, 3 = PAUSED in html5-qrcode
        if (state === 2 || state === 3) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.error("Error stopping scanner", e);
      }
      scannerRef.current = null;
    }
    setScannerReady(false);
  };

  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    handledRef.current = false;
    setErrorMsg("");
    setScannerReady(false);

    const timer = setTimeout(async () => {
      const element = document.getElementById("reader");
      if (!element) return;

      // عنصر جديد كل مرة عشان ما يتداخل مع تشغيل سابق
      element.innerHTML = "";

      const scanner = new Html5Qrcode("reader", {
        formatsToSupport: FORMATS,
        verbose: false,
      });
      scannerRef.current = scanner;

      const config = {
        fps: 10,
        // مستطيل عريض يناسب الباركود الطولي + QR
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const w = Math.floor(Math.min(viewfinderWidth * 0.85, 320));
          const h = Math.floor(Math.min(w * 0.45, 140));
          return { width: w, height: h };
        },
        aspectRatio: 1.777,
        disableFlip: false,
      };

      const onSuccess = async (decodedText) => {
        if (handledRef.current) return;
        handledRef.current = true;
        const code = String(decodedText || "").trim();
        await stopScanner();
        if (code) onScan(code);
      };

      try {
        // جرّب الكاميرا الخلفية أولاً
        await scanner.start(
          { facingMode: "environment" },
          config,
          onSuccess,
          () => {},
        );
        if (isMounted) setScannerReady(true);
      } catch (err1) {
        console.warn("Back camera failed, trying any camera…", err1);
        try {
          // fallback: أي كاميرا متاحة
          const cameras = await Html5Qrcode.getCameras();
          if (!cameras?.length) {
            if (isMounted) {
              setErrorMsg(
                "No camera found. Allow camera permission or type the code manually.",
              );
            }
            return;
          }
          await scanner.start(cameras[0].id, config, onSuccess, () => {});
          if (isMounted) setScannerReady(true);
        } catch (err2) {
          console.error("Camera start failed", err2);
          if (isMounted) {
            setErrorMsg(
              err2?.message ||
                "Could not open camera. Check browser permission (HTTPS required).",
            );
          }
        }
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [open]);

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          bgcolor: "#0F172A",
          boxShadow: "none",
          backgroundImage: "none",
        },
      }}
    >
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#fff",
        }}
      >
        <Typography variant="h6">Scan Barcode / QR</Typography>
        <IconButton onClick={handleClose} sx={{ color: "#fff" }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {errorMsg && (
        <Alert severity="warning" sx={{ mx: 2, mb: 1, borderRadius: 2 }}>
          {errorMsg}
        </Alert>
      )}

      <Box
        sx={{
          position: "relative",
          minHeight: 320,
          bgcolor: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <Box id="reader" sx={{ width: "100%" }} />
        {!scannerReady && !errorMsg && (
          <Box
            sx={{
              position: "absolute",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CircularProgress sx={{ color: "#f2d237" }} />
          </Box>
        )}
      </Box>

      <Typography
        variant="caption"
        sx={{ color: "rgba(255,255,255,0.6)", textAlign: "center", py: 1.5 }}
      >
        Hold the barcode steady inside the frame · works with EAN / Code128 / QR
      </Typography>
    </Dialog>
  );
}
