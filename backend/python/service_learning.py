"""Local service-name classifier. Only approved catalogue labels are trained.
Predictions are suggestions; only saving an explicit code mapping affects money.
"""
import math,re,unicodedata
from collections import Counter,defaultdict
from revenue_engine import DEFAULT_KINDS

def words(name):
    name=''.join(c for c in unicodedata.normalize('NFD',str(name)) if not unicodedata.combining(c)).lower().replace('đ','d')
    return re.findall(r'[a-z0-9]+',name)

def service_suggestions(catalog,config,rows):
    kinds={**DEFAULT_KINDS,**config.get('serviceKinds',{})};counts=defaultdict(Counter);docs=Counter();vocab=set();exact=defaultdict(set)
    for item in catalog:
        if item['code'] not in kinds:continue
        label=(item['group'],kinds[item['code']]);ts=words(item['name'])
        if not ts:continue
        docs[label]+=1;counts[label].update(ts);vocab.update(ts);exact[' '.join(ts)].add(label)
    known={c['code'] for c in catalog};groups=defaultdict(set)
    for row in rows:
        code=row.get('service_code');name=row.get('service_name')
        if isinstance(code,str) and code not in known and isinstance(name,str) and name.strip():groups[code].add(name)
    result=[]
    for code,names in groups.items():
        if len(names)!=1:continue
        ts=words(next(iter(names)));seen=[t for t in ts if t in vocab];matches=exact.get(' '.join(ts),set())
        if len(matches)>1 or not seen:continue
        scores=[]
        for label in docs:
            score=math.log((docs[label]+1)/(sum(docs.values())+len(docs)))+sum(math.log((counts[label][t]+1)/(sum(counts[label].values())+len(vocab))) for t in seen)
            scores.append((label,score))
        scores.sort(key=lambda p:-p[1])
        if not scores:continue
        label=next(iter(matches)) if matches else scores[0][0]
        score=1.0 if matches else 1/sum(math.exp(v-scores[0][1]) for _,v in scores)
        result.append(dict(code=code,group=label[0],kind=label[1],score=score,trainingCount=sum(docs.values()),basis='Tên trùng danh mục đã xác nhận' if matches else 'Naive Bayes từ tên dịch vụ đã xác nhận'))
    return result
