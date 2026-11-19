"""Approved-snapshot meeting slides and PowerPoint rendering in Python."""
import io
import math
from copy import deepcopy

from classification import BILLING_NAMES, finance_routes
from reporting import PENDING_RULES


def fmt(value):
    # Intl.NumberFormat('vi-VN') equivalent for the existing report quantities:
    # three fractional places, half up, period thousands/comma decimals.
    from decimal import Decimal, ROUND_HALF_UP
    n = Decimal(str(value)).quantize(Decimal('.001'), rounding=ROUND_HALF_UP)
    whole, _, fraction = format(n, 'f').partition('.')
    grouped = f'{int(whole):,}'.replace(',', '.')
    fraction = fraction.rstrip('0')
    return grouped + (',' + fraction if fraction else '')


def meeting_slides(report):
    if not isinstance(report, dict) or report.get('status') != 'approved':
        raise ValueError('Cần báo cáo đã duyệt trước khi xuất PowerPoint.')
    stats = report['stats']
    scope = stats['scopeLabel'] + '. ' if stats.get('scopeLabel') else 'Snapshot cũ: giữ nguyên phạm vi khi chốt. '
    slides = [dict(title='Báo cáo giao ban Khoa Vú', headers=['Chỉ tiêu', 'Giá trị', 'Đơn vị'],
                   rows=[['Sản lượng hoàn thành', fmt(stats['qty']), 'đơn vị dịch vụ'],
                         ['Giá trị nguồn trước giảm', fmt(stats['gross']), 'VND'],
                         ['Sau giảm / phân bổ đã biết', fmt(stats['net']), 'VND'],
                         ['Dòng thiếu sau giảm', stats['missing'], 'dòng']],
                   note=scope + 'Các giá trị là các góc nhìn riêng, không cộng chồng. Chưa phải tiền thực thu.')]
    services = [r for r in stats['table'] if r['qty']]
    for i in range(0, len(services), 7):
        slides.append(dict(title=f'Chi tiết dịch vụ · {i // 7 + 1}', headers=['Dịch vụ', 'SL hoàn thành', 'Trước giảm VND', 'Sau giảm đã biết VND'],
                           rows=[[r['name'], fmt(r['qty']), fmt(r['gross']), fmt(r['net'])] for r in services[i:i + 7]],
                           note='Đơn vị dịch vụ không đồng nhất số lượt hay số người. Dòng thiếu sau giảm được ghi ở phần đối soát.'))
    revenue = report.get('serviceRevenue')
    if revenue:
        for i in range(0, len(revenue['lines']), 7):
            slides.append(dict(title=f'Doanh thu theo đơn giá × số lượng · {i // 7 + 1}', headers=['Dịch vụ / nhóm giá', 'Đơn giá VND', 'SL', 'Doanh thu VND'],
                               rows=[[r['name'] + ' / ' + BILLING_NAMES[r['type']], 'Chờ đối soát' if r['price'] is None else fmt(r['price']), fmt(r['qty']), 'Chưa tính' if r['revenue'] is None else fmt(r['revenue'])] for r in revenue['lines'][i:i + 7]],
                               note=f"Phần tính được: {fmt(revenue['knownRevenue'])} VND; {revenue['missingRecords']} dòng chưa đủ giá/phân loại. Giá và cấu hình giữ tại thời điểm chốt."))
    all_revenue=report.get('allRevenue')
    if all_revenue:
        for key,title in [('byOrdering','Doanh thu tất cả khoa · khoa chỉ định'),('byPerforming','Doanh thu tất cả khoa · khoa thực hiện'),('byBilling','Doanh thu tất cả khoa · nhóm giá')]:
            for i in range(0,len(all_revenue[key]),7):
                slides.append(dict(title=title,headers=['Khoa / nhóm','Số lượng','Doanh thu đủ giá VND','Dòng thiếu giá'],rows=[[r['label'],fmt(r['qty']),fmt(r['knownRevenue']),r['missingRecords']] for r in all_revenue[key][i:i+7]],note=f"Tổng toàn bộ khoa: {fmt(all_revenue['revenue']['knownRevenue'])} VND; {all_revenue['pendingRecords']} dòng chưa rõ khoa chưa cộng. Hai góc nhìn khoa không cộng với nhau. Snapshot cố định."))
        for i in range(0,len(all_revenue['revenue']['lines']),7):
            slides.append(dict(title='Doanh thu tất cả khoa · từng dịch vụ',headers=['Dịch vụ / nhóm giá','Đơn giá VND','Số lượng','Doanh thu VND'],rows=[[r['name']+' / '+BILLING_NAMES[r['type']],'Chờ đối soát' if r['price'] is None else fmt(r['price']),fmt(r['qty']),'Chưa tính' if r['revenue'] is None else fmt(r['revenue'])] for r in all_revenue['revenue']['lines'][i:i+7]],note='Mọi khoa trong nguồn hợp lệ tại thời điểm chốt; thiếu giá giữ chưa xác định.'))
    routes = finance_routes(stats['completed'], (revenue or {}).get('configuration'))
    slides.append(dict(title='Phân loại tài chính theo khoa', headers=['Phần dữ liệu', 'SL hoàn thành', 'Trước giảm VND'], rows=[[r['label'], fmt(r['qty']), fmt(r['gross'])] for r in routes], note='Các phần tách biệt. Không tự gán khoa từ tên dịch vụ.'))
    slides.append(dict(title='Đối soát và nhận xét', headers=['Nội dung', 'Chi tiết'], rows=[['Nguồn bị loại trước chốt', f"{report.get('excludedCount') or 0} dòng toàn nguồn"], ['Thiếu sau giảm', f"{stats['missing']} dòng trong kỳ"], ['Đến muộn không cộng', f"{stats['late']} dòng"]], note=report.get('narrative') or 'Chưa có nhận xét.'))
    for i in range(0, len(PENDING_RULES), 3):
        slides.append(dict(title=f'Nghiệp vụ chờ khoa xác nhận · {i // 3 + 1}', headers=['Nội dung', 'Giới hạn'], rows=deepcopy(PENDING_RULES[i:i + 3]), note='Báo cáo nội bộ theo nguồn và quy tắc tại thời điểm chốt; các mục chờ xác nhận được liệt kê trong bảng.'))
    return slides


def presentation(report):
    from pptx import Presentation
    from pptx.util import Inches, Pt
    from pptx.dml.color import RGBColor
    from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
    deck = Presentation()
    deck.slide_width, deck.slide_height = Inches(13.333333), Inches(7.5)
    deck.core_properties.author = 'Khoa Vú · Dashboard nội bộ'
    deck.core_properties.title = 'Báo cáo giao ban'
    deck.core_properties.subject = report['id']
    pink, ink, muted = 'EBC6D5', '74445B', '6B5962'
    white = 'FFFFFF'
    def textbox(slide, value, x, y, width, height, size=12, bold=False, color=ink):
        shape = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(width), Inches(height))
        frame = shape.text_frame
        frame.word_wrap = True
        frame.margin_left = frame.margin_right = Inches(.02)
        paragraph = frame.paragraphs[0]
        paragraph.text = str(value)
        for run in paragraph.runs:
            run.font.name = 'Arial'
            run.font.size = Pt(size)
            run.font.bold = bold
            run.font.color.rgb = RGBColor.from_string(color)
        return shape
    def capacity(data):
        # Wrap long clinical service names and notes rather than silently
        # clipping rows. Split additional pages with headers repeated.
        max_chars = 52 if len(data['headers']) <= 2 else 36
        pages, page, height = [], [], 0
        for row in data['rows']:
            lines = max(max(1, math.ceil(len(str(v if v is not None else 'Chưa có')) / max_chars)) for v in row)
            row_height = max(.4, .22 * lines + .12)
            if page and height + row_height > 3.85:
                pages.append(page)
                page, height = [], 0
            page.append((row, min(row_height, 3.85)))
            height += row_height
        if page or not pages:
            pages.append(page)
        return pages
    page_number = 0
    for data in meeting_slides(report):
        for part, rows in enumerate(capacity(data)):
            page_number += 1
            slide = deck.slides.add_slide(deck.slide_layouts[6])
            slide.background.fill.solid()
            slide.background.fill.fore_color.rgb = RGBColor.from_string('FFFAFC')
            title = data['title'] + (f' · tiếp {part + 1}' if part else '')
            textbox(slide, title, .6, .35, 12.1, .6, 24, True)
            textbox(slide, f"{report['week']} → trước {report['end']} · {report['id']} · v{report['version']}", .6, 1.02, 12.1, .45, 11, color=muted)
            count = len(data['headers'])
            table = slide.shapes.add_table(len(rows) + 1, count, Inches(.6), Inches(1.65), Inches(12.1), Inches(.45 + sum(h for _, h in rows))).table
            # Give narrative/service columns room while keeping quantities
            # aligned. All editable table cells are retained in the PPTX.
            if count == 2:
                table.columns[0].width, table.columns[1].width = Inches(3.2), Inches(8.9)
            elif count >= 3:
                table.columns[0].width = Inches(5.2)
                for i in range(1, count):
                    table.columns[i].width = Inches(6.9 / (count - 1))
            table.rows[0].height = Inches(.45)
            contents = [data['headers']] + [row for row, _ in rows]
            for ri, row in enumerate(contents):
                if ri:
                    table.rows[ri].height = Inches(rows[ri - 1][1])
                for ci, value in enumerate(row):
                    cell = table.cell(ri, ci)
                    cell.text = str(value if value is not None else 'Chưa có')
                    cell.margin_left = cell.margin_right = Inches(.08)
                    cell.vertical_anchor = MSO_ANCHOR.MIDDLE
                    cell.fill.solid()
                    cell.fill.fore_color.rgb = RGBColor.from_string(pink if ri == 0 else white)
                    for paragraph in cell.text_frame.paragraphs:
                        paragraph.alignment = PP_ALIGN.LEFT
                        for run in paragraph.runs:
                            run.font.name = 'Arial'
                            run.font.size = Pt(12 if ri == 0 else 11)
                            run.font.bold = ri == 0
                            run.font.color.rgb = RGBColor.from_string(ink)
            textbox(slide, data['note'], .6, 6.03, 12.1, .86, 10, color=muted)
            textbox(slide, f'Khoa Vú · Báo cáo nội bộ · {page_number}', .6, 7.06, 12.1, .25, 9, color=muted)
            slide.notes_slide.notes_text_frame.text = f"Snapshot {report['id']}; chốt {report['createdAt']}. Cùng số liệu với Excel báo cáo.\n{data['note']}"
    output = io.BytesIO()
    deck.save(output)
    return output.getvalue()
