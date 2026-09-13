from pathlib import Path
from io import BytesIO

import fitz
import pytesseract
from PIL import Image


def extract_text_from_image(
    file_path: Path,
) -> str:
    image = Image.open(file_path)

    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")

    text = pytesseract.image_to_string(
        image,
        config="--psm 6",
    )

    return text.strip()


def extract_text_from_pdf(
    file_path: Path,
) -> str:
    document = fitz.open(file_path)

    extracted_pages = []

    try:
        for page_number, page in enumerate(document):
            if page_number >= 5:
                break

            # First try extracting embedded PDF text.
            direct_text = page.get_text("text").strip()

            if len(direct_text) >= 20:
                extracted_pages.append(direct_text)
                continue

            # If the PDF is scanned/image-based, use OCR.
            pixmap = page.get_pixmap(
                matrix=fitz.Matrix(2, 2),
                alpha=False,
            )

            image = Image.open(
                BytesIO(
                    pixmap.tobytes("png")
                )
            )

            ocr_text = pytesseract.image_to_string(
                image,
                config="--psm 6",
            )

            extracted_pages.append(
                ocr_text.strip()
            )

    finally:
        document.close()

    return "\n\n".join(
        page_text
        for page_text in extracted_pages
        if page_text
    ).strip()


def extract_receipt_text(
    file_path: Path,
) -> str:
    extension = file_path.suffix.lower()

    if extension in {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
    }:
        text = extract_text_from_image(
            file_path
        )

    elif extension == ".pdf":
        text = extract_text_from_pdf(
            file_path
        )

    else:
        raise ValueError(
            "Unsupported receipt file type."
        )

    if not text:
        raise ValueError(
            "No readable text could be extracted "
            "from the receipt."
        )

    return text