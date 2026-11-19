"""Read-only revenue reconciliation and robust outlier flags; no imputation."""
from collections import defaultdict
from decimal import Decimal
from revenue_engine import applied_rate, billing_type, gross_amount, integer, safe
from classification import selected_rows, validate_config

def finance_review(rows, config=None, department='ORDERING_VU'):
    config=config or {};validate_config(config);groups=defaultdict(list);outliers=[];checks=[]
    for row in selected_rows(rows,config,department): groups[(row['service_code'],billing_type(row,config))].append(row)
    for (code,kind),own in groups.items():
        calculated=[];known=[];missing_price=0;missing_net=0;prices=[]
        for row in own:
            price,_=applied_rate(row,kind,config)
            if price is None:missing_price+=1
            else:calculated.append(gross_amount(row['completed_qty'],price))
            if row.get('completed_net_vnd') is None:missing_net+=1
            else:
                if not integer(row['completed_net_vnd']): raise ValueError('Sau giảm nguồn phải là số nguyên VND hợp lệ.')
                known.append(int(Decimal(str(row['completed_net_vnd']))))
            if price is not None:prices.append((Decimal(price),row))
        total=safe(sum(calculated));net=safe(sum(known));delta=None if missing_price or missing_net else safe(total-net)
        checks.append(dict(key=code+'|'+kind,code=code,name=own[0].get('service_name'),type=kind,rows=len(own),calculated=total,sourceNetKnown=net,missingPrice=missing_price,missingNet=missing_net,difference=delta))
        # Tukey hinges via nearest-rank quartiles, within the same code and tariff.
        # At least 8 values; equal quartiles do not establish an outlier boundary.
        if len(prices)>=8:
            values=sorted(p for p,_ in prices);q1=values[(len(values)-1)//4];q3=values[3*(len(values)-1)//4];iqr=q3-q1
            if iqr>0:
                low,high=q1-Decimal('1.5')*iqr,q3+Decimal('1.5')*iqr
                for price,row in prices:
                    if price<low or price>high:
                        outliers.append(dict(code=code,type=kind,price=int(price),order_id=row.get('order_id'),source_file=row.get('source_file'),source_row=row.get('source_row'),reason='Đơn giá ngoài khoảng IQR của cùng dịch vụ và nhóm giá; chỉ cảnh báo, không loại.'))
    return dict(checks=checks,outliers=outliers,method='Đối chiếu từng dòng + IQR 1,5; không điền giá trị thiếu, không dự báo vào doanh thu thực tế.')
