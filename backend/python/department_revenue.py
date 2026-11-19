"""All departments, orthogonal revenue views; no double-counting across axes."""
from copy import deepcopy
from classification import revenue_scope, resolve_dept, normalize_dept, validate_config, ROUTES, BILLING_NAMES
from revenue_engine import calculate, billing_type, sum_quantity
NAMES={'VU':'Khoa Vú','CDHA':'Chẩn đoán hình ảnh','KSKTQ':'Sức khỏe tổng quát','GPB':'Giải phẫu bệnh','XETNGHIEM':'Xét nghiệm','GAYME':'Gây mê hồi sức','UNGBUOU':'Ung bướu','NOI':'Nội khoa'}
LABELS={'VU_INTERNAL':'Vú chỉ định · Vú thực hiện','VU_OUTBOUND':'Vú chỉ định · khoa khác thực hiện','VU_INBOUND':'Khoa khác chỉ định · Vú thực hiện','EXTERNAL_UNRELATED':'Khoa khác chỉ định · khoa khác thực hiện'}
def department_revenue(rows,config=None):
    config=config or {};validate_config(config)
    completed=[r for r in rows if r.get('status')=='HOANTHANH' and str(r.get('in_snapshot')) in ['1','1.0']]
    scope=revenue_scope(completed,config)
    accepted=[r['row'] for r in scope['records'] if not r['pending']]
    def summary(key,label,own):
        value=calculate(own,config)
        return dict(key=key,label=label,records=len(own),qty=sum_quantity(r['completed_qty'] for r in own),knownRevenue=value['knownRevenue'],missingRecords=value['missingRecords'],missingQty=value['missingQty'])
    def departments(field):
        groups={}
        for row in accepted:groups.setdefault(resolve_dept(row.get(field)) or normalize_dept(row.get(field)),[]).append(row)
        return [summary(key,NAMES.get(key,str(own[0][field])),own) for key,own in groups.items()]
    return dict(version='ALL-DEPT-1',revenue=calculate(accepted,config),byOrdering=departments('ordering_dept'),byPerforming=departments('performing_dept'),byRoute=[summary(key,LABELS[key],[r['row'] for r in scope['records'] if r['label']==key and not r['pending']]) for key in ROUTES],byBilling=[summary(key,label,[r for r in accepted if billing_type(r,config)==key]) for key,label in BILLING_NAMES.items()],records=len(accepted),pendingRecords=len(scope['pending']),pendingQty=sum_quantity(r['row']['completed_qty'] for r in scope['pending']))
def all_revenue_snapshot(rows,config=None):
    return dict(department_revenue(rows,config),sourceRows=deepcopy(rows),configuration=deepcopy(config or {}))
