from pathlib import Path
import re
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image as ReportLabImage, KeepTogether
from reportlab.pdfgen.canvas import Canvas
from PIL import Image as PILImage

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'downloads' / 'Gold_Trail_Tycoon_Minigames.md'
DOCX_OUT = ROOT / 'downloads' / 'Gold_Trail_Tycoon_Minigames.docx'
PDF_OUT = ROOT / 'downloads' / 'Gold_Trail_Tycoon_Minigames.pdf'

# Section numbering is stable in the source design document, while section
# titles are localized. Asset placement therefore does not depend on language.
CONCEPT_SECTIONS = [
    (r'^## 1\.1 ', 'Western Dice'),
    (r'^## 2\.1 ', 'Archery Challenge'),
    (r'^## 3\.1 ', 'Knife Throwing'),
    (r'^## 3\.2 ', 'Safe Cracking'),
    (r'^## 3\.3 ', 'Quick Draw Duel'),
    (r'^## 4\.1 ', 'Revolver Shooting'),
    (r'^## 4\.2 ', 'Wanted Poster Hunt'),
    (r'^## 5\.1 ', 'Gold Panning'),
    (r'^## 5\.2 Fishing / Rybolov$', 'Fishing / Rybolov'),
    (r'^## 6\.1 ', 'Dynamite Mining'),
    (r'^## 7\.1 ', 'Horseshoe Challenge'),
    (r'^## 7\.2 ', 'Lasso Challenge'),
    (r'^## 7\.3 ', 'Horse Riding'),
    (r'^## 8\.1 ', 'Train Loading'),
    (r'^# 9\. ', 'Expeditions'),
    (r'^# 10\. ', 'Trading Post'),
    (r'^# 11\. ', 'Combat'),
    (r'^# Znečistenie & Living Conditions$', 'Znečistenie & Living Conditions'),
]


def load_concept_assets():
    """Read actual image filenames from data.js and validate every asset."""
    data_text = (ROOT / 'assets' / 'js' / 'data.js').read_text(encoding='utf-8')
    found = {}
    for match in re.finditer(r"title:'([^']+)'[^\n]*?image:'([^']+)'", data_text):
        title, filename = match.groups()
        image_path = ROOT / filename
        if not image_path.is_file():
            raise FileNotFoundError(f'Missing concept image for {title}: {filename}')
        found[title] = image_path
    missing = [title for _, title in CONCEPT_SECTIONS if title not in found]
    if missing:
        raise ValueError(f'No image mapping in data.js for: {", ".join(missing)}')
    return found


def concept_for_heading(line, assets):
    for pattern, title in CONCEPT_SECTIONS:
        if re.match(pattern, line):
            return title, assets[title]
    return None


def image_dimensions(image_path, max_width, max_height):
    with PILImage.open(image_path) as image:
        source_width, source_height = image.size
    scale = min(max_width / source_width, max_height / source_height)
    return source_width * scale, source_height * scale


def ensure_markdown_images(lines, assets):
    """Add repository-relative concept image links immediately after sections."""
    existing = '\n'.join(lines)
    output = []
    for line in lines:
        output.append(line)
        concept = concept_for_heading(line, assets)
        if not concept:
            continue
        title, image_path = concept
        relative = f'../{image_path.relative_to(ROOT).as_posix()}'
        if f']({relative})' in existing:
            continue
        output.extend(['', f'![Koncept art – {title}]({relative})', ''])
    return output


def add_docx_concept_image(doc, image_path, title):
    width, height = image_dimensions(image_path, 6.7 * 96, 4.25 * 96)
    paragraph = doc.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.space_before = Pt(3)
    paragraph.paragraph_format.space_after = Pt(2)
    shape = paragraph.add_run().add_picture(
        str(image_path), width=Inches(width / 96), height=Inches(height / 96)
    )
    doc_pr = shape._inline.docPr
    doc_pr.set('title', f'Koncept art – {title}')
    doc_pr.set('descr', f'Koncept art – {title}')
    caption = doc.add_paragraph()
    caption.alignment = WD_ALIGN_PARAGRAPH.CENTER
    caption.paragraph_format.space_after = Pt(7)
    run = caption.add_run(f'Koncept art – {title}')
    run.italic = True
    run.font.size = Pt(8)
    run.font.color.rgb = RGBColor(130, 92, 55)


def pdf_concept_flowables(image_path, title, regular, italic):
    width, height = image_dimensions(image_path, 174 * mm, 104 * mm)
    image = ReportLabImage(str(image_path), width=width, height=height)
    image.hAlign = 'LEFT'
    caption_style = ParagraphStyle(
        f'Caption{title}', parent=getSampleStyleSheet()['BodyText'],
        fontName=italic, fontSize=7.5, leading=9, textColor=colors.HexColor('#8E6040'),
        alignment=TA_LEFT, spaceBefore=2, spaceAfter=6,
    )
    caption = Paragraph(f'Koncept art – {title}', caption_style)
    return [Spacer(1, 4), image, caption]

def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:fill'), fill)
    tc_pr.append(shd)

def set_cell_borders(cell, color='D9D9D9'):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    borders = tc_pr.first_child_found_in('w:tcBorders')
    if borders is None:
        borders = OxmlElement('w:tcBorders')
        tc_pr.append(borders)
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        tag = 'w:' + edge
        element = borders.find(qn(tag))
        if element is None:
            element = OxmlElement(tag)
            borders.append(element)
        element.set(qn('w:val'), 'single')
        element.set(qn('w:sz'), '4')
        element.set(qn('w:space'), '0')
        element.set(qn('w:color'), color)

def plain(text):
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = re.sub(r'`(.*?)`', r'\1', text)
    return text

def build_docx(lines, assets):
    doc = Document()
    section = doc.sections[0]
    section.top_margin = Inches(.72)
    section.bottom_margin = Inches(.72)
    section.left_margin = Inches(.82)
    section.right_margin = Inches(.82)
    styles = doc.styles
    styles['Normal'].font.name = 'Arial'
    styles['Normal'].font.size = Pt(10)
    styles['Normal'].font.color.rgb = RGBColor(45, 31, 22)
    for style_name, size, color in [('Title', 25, '000000'), ('Heading 1', 17, '000000'), ('Heading 2', 13, '000000'), ('Heading 3', 11, '000000')]:
        style = styles[style_name]
        style.font.name = 'Arial'
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = RGBColor.from_string(color)
    styles['Title'].paragraph_format.space_after = Pt(5)
    styles['Heading 1'].paragraph_format.space_before = Pt(18)
    styles['Heading 1'].paragraph_format.space_after = Pt(7)
    styles['Heading 2'].paragraph_format.space_before = Pt(12)
    styles['Heading 2'].paragraph_format.space_after = Pt(5)
    title = doc.add_paragraph(style='Title')
    title.add_run('Gold Trail Tycoon Minihry a gameplay systémy')
    subtitle = doc.add_paragraph('Schválená design referencia · Gold Trail Tycoon')
    subtitle.runs[0].italic = True
    subtitle.runs[0].font.color.rgb = RGBColor(130, 92, 55)
    doc.add_paragraph('Tento dokument obsahuje aktuálne odsúhlasené návrhy minihier a väčších gameplay systémov pre Gold Trail Tycoon. Zameriava sa na lokáciu, sprístupnenie, fungovanie, gameplay loopy, ovládanie a úlohu jednotlivých systémov v širšom westernovom svete.')
    doc.add_paragraph()
    table_rows = []
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        if line.startswith('!['):
            i += 1
            continue
        if line.startswith('|'):
            row = [plain(x.strip()) for x in line.strip('|').split('|')]
            if not all(re.fullmatch(r'[- :]+', x) for x in row):
                table_rows.append(row)
            i += 1
            continue
        if table_rows:
            table = doc.add_table(rows=len(table_rows), cols=max(len(r) for r in table_rows))
            table.style = 'Table Grid'
            for ri, row in enumerate(table_rows):
                for ci in range(len(table.columns)):
                    value = row[ci] if ci < len(row) else ''
                    cell = table.cell(ri, ci)
                    cell.text = value
                    set_cell_borders(cell)
                    if ri == 0:
                        set_cell_shading(cell, '5C3826')
                        for run in cell.paragraphs[0].runs:
                            run.font.bold = True
                            run.font.color.rgb = RGBColor(255, 245, 224)
                    else:
                        set_cell_shading(cell, 'F7F1E7' if ri % 2 == 0 else 'FFFFFF')
            doc.add_paragraph()
            table_rows = []
        if not line:
            i += 1
            continue
        if line.strip() == '---':
            i += 1
            continue
        if line.startswith('# '):
            p = doc.add_paragraph(style='Heading 1')
            p.add_run(plain(line[2:]))
            concept = concept_for_heading(line, assets)
            if concept:
                add_docx_concept_image(doc, concept[1], concept[0])
        elif line.startswith('## '):
            p = doc.add_paragraph(style='Heading 2')
            p.add_run(plain(line[3:]))
            concept = concept_for_heading(line, assets)
            if concept:
                add_docx_concept_image(doc, concept[1], concept[0])
        elif line.startswith('### '):
            p = doc.add_paragraph(style='Heading 3')
            p.add_run(plain(line[4:]))
        elif re.match(r'^[-*] ', line):
            p = doc.add_paragraph(style='List Bullet')
            p.add_run(plain(line[2:]))
        else:
            p = doc.add_paragraph()
            if line.startswith('**') and line.endswith('**'):
                run = p.add_run(plain(line))
                run.bold = True
                run.font.color.rgb = RGBColor(92, 56, 38)
            else:
                p.add_run(plain(line))
        i += 1
    if table_rows:
        table = doc.add_table(rows=len(table_rows), cols=max(len(r) for r in table_rows))
        table.style = 'Table Grid'
        for ri, row in enumerate(table_rows):
            for ci in range(len(table.columns)):
                cell = table.cell(ri, ci)
                cell.text = row[ci] if ci < len(row) else ''
                set_cell_borders(cell)
    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer_run = footer.add_run('GOLD TRAIL TYCOON  ·  MINIHRY A GAMEPLAY SYSTÉMY')
    footer_run.font.size = Pt(8)
    footer_run.font.color.rgb = RGBColor(130, 92, 55)
    doc.save(DOCX_OUT)

def register_fonts():
    candidates = [Path('C:/Windows/Fonts/arial.ttf'), Path('C:/Windows/Fonts/arialbd.ttf'), Path('C:/Windows/Fonts/ariali.ttf')]
    if all(p.exists() for p in candidates):
        pdfmetrics.registerFont(TTFont('Arial', str(candidates[0])))
        pdfmetrics.registerFont(TTFont('Arial-Bold', str(candidates[1])))
        pdfmetrics.registerFont(TTFont('Arial-Italic', str(candidates[2])))
        return 'Arial', 'Arial-Bold', 'Arial-Italic'
    return 'Helvetica', 'Helvetica-Bold', 'Helvetica-Oblique'

def header_footer(canvas: Canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor('#D3BE9E'))
    canvas.line(18*mm, 15*mm, 192*mm, 15*mm)
    canvas.setFont('Arial', 7) if 'Arial' in pdfmetrics.getRegisteredFontNames() else canvas.setFont('Helvetica', 7)
    canvas.setFillColor(colors.HexColor('#8B6E50'))
    canvas.drawString(18*mm, 10*mm, 'GOLD TRAIL TYCOON  ·  MINIHRY A GAMEPLAY SYSTÉMY')
    canvas.drawRightString(192*mm, 10*mm, f'{doc.page}')
    canvas.restoreState()

def build_pdf(lines, assets):
    regular, bold, italic = register_fonts()
    styles = getSampleStyleSheet()
    body = ParagraphStyle('Body', parent=styles['BodyText'], fontName=regular, fontSize=9.5, leading=14, textColor=colors.HexColor('#3B2B20'), spaceAfter=5)
    title = ParagraphStyle('TitleGT', parent=body, fontName=bold, fontSize=24, leading=28, textColor=colors.HexColor('#20150F'), alignment=TA_CENTER, spaceAfter=5)
    subtitle = ParagraphStyle('SubtitleGT', parent=body, fontName=italic, fontSize=10, leading=14, textColor=colors.HexColor('#8E6040'), alignment=TA_CENTER, spaceAfter=20)
    h1 = ParagraphStyle('H1GT', parent=body, fontName=bold, fontSize=17, leading=21, textColor=colors.HexColor('#20150F'), spaceBefore=13, spaceAfter=7, keepWithNext=True)
    h2 = ParagraphStyle('H2GT', parent=body, fontName=bold, fontSize=12.5, leading=16, textColor=colors.HexColor('#5C3826'), spaceBefore=10, spaceAfter=5, keepWithNext=True)
    h3 = ParagraphStyle('H3GT', parent=body, fontName=bold, fontSize=10.5, leading=14, textColor=colors.HexColor('#8E6040'), spaceBefore=7, spaceAfter=4, keepWithNext=True)
    bullet = ParagraphStyle('BulletGT', parent=body, leftIndent=13, firstLineIndent=-8, bulletIndent=0, spaceAfter=2)
    story = [Spacer(1, 30*mm), Paragraph('Gold Trail Tycoon Minihry a gameplay systémy', title), Paragraph('Schválená design referencia · Gold Trail Tycoon', subtitle), Paragraph('Tento dokument obsahuje aktuálne odsúhlasené návrhy minihier a väčších gameplay systémov pre Gold Trail Tycoon. Zameriava sa na lokáciu, sprístupnenie, fungovanie, gameplay loopy, ovládanie a úlohu jednotlivých systémov v širšom westernovom svete.', body), PageBreak()]
    table_rows = []
    def flush_table():
        nonlocal table_rows
        if not table_rows: return
        cols = max(len(r) for r in table_rows)
        rows = [r + ['']*(cols-len(r)) for r in table_rows]
        t = Table(rows, repeatRows=1, colWidths=[174*mm/cols]*cols)
        t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#5C3826')),('TEXTCOLOR',(0,0),(-1,0),colors.white),('FONTNAME',(0,0),(-1,0),bold),('FONTNAME',(0,1),(-1,-1),regular),('FONTSIZE',(0,0),(-1,-1),7.5),('LEADING',(0,0),(-1,-1),10),('BACKGROUND',(0,1),(-1,-1),colors.HexColor('#F7F1E7')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.HexColor('#F7F1E7'), colors.white]),('GRID',(0,0),(-1,-1),.35,colors.HexColor('#D9D9D9')),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
        story.append(Spacer(1, 5)); story.append(t); story.append(Spacer(1, 8)); table_rows = []
    for line in lines:
        line = line.rstrip()
        if line.startswith('!['):
            continue
        if line.startswith('|'):
            row = [plain(x.strip()) for x in line.strip('|').split('|')]
            if not all(re.fullmatch(r'[- :]+', x) for x in row): table_rows.append(row)
            continue
        flush_table()
        if not line:
            story.append(Spacer(1, 3)); continue
        if line.strip() == '---':
            continue
        safe = plain(line).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        if line.startswith('# '):
            heading = Paragraph(safe[2:], h1)
            concept = concept_for_heading(line, assets)
            if concept:
                story.append(KeepTogether([heading] + pdf_concept_flowables(concept[1], concept[0], regular, italic)))
            else:
                story.append(heading)
        elif line.startswith('## '):
            heading = Paragraph(safe[3:], h2)
            concept = concept_for_heading(line, assets)
            if concept:
                story.append(KeepTogether([heading] + pdf_concept_flowables(concept[1], concept[0], regular, italic)))
            else:
                story.append(heading)
        elif line.startswith('### '): story.append(Paragraph(safe[4:], h3))
        elif re.match(r'^[-*] ', line): story.append(Paragraph('• ' + safe[2:], bullet))
        elif line.startswith('**') and line.endswith('**'):
            story.append(Paragraph(f'<b>{safe}</b>', body))
        else: story.append(Paragraph(safe, body))
    flush_table()
    doc = SimpleDocTemplate(str(PDF_OUT), pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=16*mm, bottomMargin=22*mm, title='Gold Trail Tycoon Minihry a gameplay systémy', author='Gold Trail Tycoon')
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)

if __name__ == '__main__':
    concept_assets = load_concept_assets()
    source_lines = SOURCE.read_text(encoding='utf-8').splitlines()
    source_lines = ensure_markdown_images(source_lines, concept_assets)
    SOURCE.write_text('\n'.join(source_lines) + '\n', encoding='utf-8')
    build_docx(source_lines, concept_assets)
    build_pdf(source_lines, concept_assets)
    print(DOCX_OUT)
    print(PDF_OUT)
