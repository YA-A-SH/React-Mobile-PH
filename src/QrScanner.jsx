import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Dialog,
  IconButton,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

export default function QrScannerDialog({ open, onClose, onScan }) {
  const scannerRef = useRef(null);
  const [scannerReady, setScannerReady] = useState(false);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
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

    // تشغيل الماسح الضوئي للويب فوراً بدون إبطاء أو تعقيدات
    const timer = setTimeout(async () => {
      const element = document.getElementById("reader");
      if (!element) return;

      const scanner = new Html5Qrcode("reader");
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 15, qrbox: { width: 250, height: 250 } }, // رفعت الـ FPS لـ 15 لقراءة أسرع
          async (decodedText) => {
            await stopScanner();
            onScan(decodedText);
          },
          () => {},
        );
        if (isMounted) setScannerReady(true);
      } catch (err) {
        console.error("Web camera error", err);
      }
    }, 100);

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
          color: "#fff",
        }}
      >
        <Typography variant="h6">Scan Barcode / QR</Typography>
        <IconButton onClick={handleClose} sx={{ color: "#fff" }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          position: "relative",
          minHeight: 300,
          bgcolor: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box id="reader" sx={{ width: "100%" }} />
        {!scannerReady && (
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
    </Dialog>
  );
}
