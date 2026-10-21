"""Offline risk classification over cached HEAD results; never confers public approval."""
import json,re
from pathlib import Path
from urllib.parse import urlparse,unquote
from collections import Counter
root=Path('reports/istanbul-39')
bundle=json.load(open('data/districts/research.json'))
checks={r['url']:r for r in json.load(open(root/'source-url-audit.json'))}
slugs=[r['district'] for r in bundle['districts']]
rows=[]
for district in bundle['districts']:
 for n,s in enumerate(district['sources'],1):
  host=urlparse(s['url']).hostname or '';c=checks.get(s['url'],{});flags=[]
  gov=host.endswith(('.gov.tr','.bel.tr')) or host=='ibb.istanbul' or host.endswith('.ibb.istanbul')
  custom=any(host==d or host.endswith('.'+d) for d in ['metro.istanbul','iett.istanbul','sehirhatlari.istanbul','bahcelievler.istanbul','kagithane.istanbul','kucukcekmece.istanbul','zeytinburnu.istanbul'])
  status=c.get('httpStatus','unchecked')
  if status in ['404','410']:flags.append('http-not-found')
  elif status=='000':flags.append('network-or-tls-failure')
  elif status not in ['200','204']:flags.append('access-not-confirmed-HEAD-not-content')
  if not gov and not custom and re.search('belediye|kaymakam|resm[iî]|tüik|bakanlı',s['title'],re.I):flags.append('official-title-publisher-identity-review')
  foreign=[d for d in slugs if d!=district['district'] and (host==d+'.gov.tr' or host==d+'.bel.tr' or host.endswith('.'+d+'.gov.tr') or host.endswith('.'+d+'.bel.tr'))]
  if foreign:flags.append('other-district-host-review-required')
  if c.get('finalUrl') and urlparse(c['finalUrl']).hostname!=host:flags.append('redirect-host-changed')
  if s['url'].startswith('http:'):flags.append('unencrypted-url')
  if re.search(r'[\x00-\x20\u2028\u2029]',unquote(s['url'])) or s['url'].endswith(("'",'\"')):flags.append('suspicious-url-characters-review')
  if any(k in host for k in ['emlak','endeksa','zingat','sahibinden']):kind='market-platform'
  elif gov:kind='official-host-not-content-approval'
  elif custom:kind='institutional-domain-identity-review'
  elif host.endswith('.edu.tr'):kind='academic-host-not-content-approval'
  else:kind='third-party-or-unclassified'
  rows.append(dict(district=district['district'],sourceIndex=n,title=s['title'],actualPublisherHost=host,url=s['url'],hostClassification=kind,httpStatus=status,finalUrl=c.get('finalUrl'),flags=flags,otherDistricts=foreign,needsVerification=True,publicDecision='excluded-raw-source; only separately reviewed editorial sources may publish'))
counts=Counter(f for r in rows for f in r['flags'])
(root/'source-inventory-audit.json').write_text(json.dumps(dict(records=len(rows),uniqueUrls=len(checks),method='HEAD erişimi ve alan adı/başlık tutarlılığı risk taraması; 200 içerik doğruluğu değildir. Başka ilçe bağlantısı bağlamsal olabilir, otomatik yanlış sayılmaz. Ham envanterin tamamı public dışıdır.',flags=dict(counts),rows=rows),ensure_ascii=False,indent=2)+'\n')
print(len(rows),len(checks),dict(counts))
