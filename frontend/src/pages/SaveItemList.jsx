import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Grid,
  Pagination,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import axios from "axios";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import bwipjs from "bwip-js";

const ITEMS_PER_PAGE = 5;

export default function SavedItemsList({ type, onEdit }) {
  const [savedItems, setSavedItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const endpoint =
          type === "sales"
            ? "api/sales"
            : "api/customers";

        const { data } = await axios.get(endpoint);
        setSavedItems(data);
      } catch (err) {
        console.error("Failed to fetch items:", err);
      }
    };

    fetchItems();
  }, [type]);

  const handleDelete = async (id) => {
    try {
      const endpoint = `api/customers/${id}`;
      await axios.delete(endpoint);
      setSavedItems((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleEdit = (item) => {
    if (typeof onEdit === "function") {
      onEdit(item);
    }
  };

  const generateBarcode = (text) => {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement("canvas");

        bwipjs.toCanvas(canvas, {
          bcid: "code128", // Barcode type
          text: text,
          scale: 2,
          height: 10,
          includetext: true,
          textxalign: "center",
        });

        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        reject(err);
      }
    });
  };

  const handleDownloadPDF = async (item) => {
    const pdf = new jsPDF();
    const margin = 10;
    let y = margin;

    const labelValue = (label, value) => {
      pdf.setFont(undefined, "bold");
      pdf.text(`${label}:`, margin, y);
      pdf.setFont(undefined, "normal");
      pdf.text(`${value || "-"}`, margin + 45, y);
      y += 7;
    };

    try {
      pdf.setFontSize(14);
      pdf.text("Item Label", margin, y);
      y += 10;

      labelValue("Item Name", item.item_name);
      labelValue("Item Number", item.item_number);
      labelValue("Net Weight", item.net_weight);
      labelValue("Gross Weight", item.gross_weight);
      labelValue("Metal Rate", item.metal_rate_per_gram);
      labelValue("Labour Charges", item.labour_charges);

      if (item.customer) {
        y += 5;
        pdf.setFontSize(13);
        pdf.text("Customer Details", margin, y);
        y += 8;
        labelValue("Name", item.customer.name);
        labelValue("Phone", item.customer.phone);
        labelValue("City", item.customer.city);
      }

      if (item.item_pic) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = item.item_pic;

        await new Promise((resolve, reject) => {
          img.onload = () => resolve(null);
          img.onerror = reject;
        });

        if (y + 50 > 270) {
          pdf.addPage();
          y = margin;
        }

        pdf.addImage(img, "JPEG", margin, y, 50, 50);
        y += 55;
      }

      const qrCodeDataURL = await QRCode.toDataURL(item.item_number || "Unknown");
      pdf.text("QR Code:", margin, y);
      pdf.addImage(qrCodeDataURL, "PNG", margin, y + 2, 30, 30);
      y += 35;

      const barcodeDataURL = await generateBarcode(item.item_number || "000000");
      pdf.text("Barcode:", margin, y);
      pdf.addImage(barcodeDataURL, "PNG", margin, y + 2, 80, 20);
      y += 25;

      pdf.save(`${item.item_number || "label"}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
    }
  };

  const totalPages = Math.ceil(savedItems.length / ITEMS_PER_PAGE);
  const paginatedItems = savedItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Saved {type === "sales" ? "Sales" : "Customer"} Entries
      </Typography>

      <Stack spacing={2}>
        {paginatedItems.map((item, index) => (
          <Paper key={item._id || index} sx={{ p: 2 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <Typography variant="subtitle1">
                  {item.item_number || "No ID"} - {item.item_name || "Unnamed"}
                </Typography>
                <Typography variant="body2">
                  Net Weight: {item.net_weight}g | Stones:{" "}
                  {item.stones?.length || 0}
                </Typography>

                {type === "customer" && item.customer && (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    <strong>Customer:</strong> {item.customer.name} <br />
                    <strong>Phone:</strong> {item.customer.phone} <br />
                    <strong>City:</strong> {item.customer.city}
                  </Typography>
                )}
              </div>

              <div>
                {item.item_pic && (
                  <Box mt={1}>
                    <img
                      src={item.item_pic}
                      alt="Product"
                      style={{
                        maxWidth: "100px",
                        maxHeight: "80px",
                        objectFit: "contain",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                      }}
                    />
                  </Box>
                )}
              </div>
            </div>

            <Grid container spacing={1} mt={1}>
              <Grid item>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleDownloadPDF(item)}
                >
                  Download Label PDF
                </Button>
              </Grid>

              {type === "customer" && (
                <Grid item>
                  <Button
                    variant="outlined"
                    size="small"
                    color="primary"
                    onClick={() => handleEdit(item)}
                  >
                    Edit
                  </Button>
                </Grid>
              )}

              <Grid item>
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  onClick={() => handleDelete(item._id)}
                >
                  Delete
                </Button>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Stack>

      {totalPages > 1 && (
        <Box mt={3} display="flex" justifyContent="center">
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(e, page) => setCurrentPage(page)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
}
