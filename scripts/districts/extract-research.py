#!/usr/bin/env python3
"""Lossless, draft-only research ingestion. Requires pypdf; never copies PDFs.
Usage: python3 scripts/districts/extract-research.py --pdf-dir /path --output /path/research.json
The registry remains the sole district/slug authority. PDF claims and URLs are NOT verified here.
"""
import argparse, hashlib, json, re, unicodedata
from pathlib import Path
from urllib.parse import urlparse
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
HEADINGS = [
 r"İlçenin Tarihçesi", r"İlçeyi Tanı|Coğrafi Konum, Genel Şehir Karakteri ve Temel Veriler|Esenyurt'u Tanımak",
 r"Yaşam ve Ulaşım", r"Mahalleler|Mahalle Morfolojisi", r"Gayrimenkul (?:Dinamikleri ve|ve) Yapı Dokusu",
 r"Önemli Şehircilik ve İmar Gelişmeleri", r"Fotoğraf Saha Rehberi", r"İlçeyi Özel Kılan Şeyler|Esenyurt'u Özel Kılan[^:]*",
 r"İleri Araştırma Konuları",
]
FIELDS = ['history','geography','life','neighborhoods','housingTexture','planningDevelopments','placesGuide','distinctiveFeatures','researchTopics']

def normalize(text):
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFC', text)).strip()

def convert(path, name, slug):
    reader = PdfReader(path)
    pages = [normalize(page.extract_text()) for page in reader.pages]
    text = ' '.join(pages)
    starts = []; end = 0
    for heading in HEADINGS:
        match = re.search(heading, text[end:])
        if not match: raise ValueError(f'{name}: missing section {heading}')
        start = end + match.start(); end += match.end(); starts.append((start,end))
    refs_pos = text.find('Alıntılanan çalışmalar')
    if refs_pos < 0: raise ValueError(f'{name}: missing reference list')
    last_end = re.search(r'(?:10\s*[.—–-]\s*)?Kaynaklar|Şaban Durali İçin Saha Notu',text[starts[-1][1]:refs_pos])
    last_end = starts[-1][1]+last_end.start() if last_end else refs_pos
    sections={}
    for i, field in enumerate(FIELDS):
        start=starts[i][1]; stop=starts[i+1][0] if i+1<len(starts) else last_end
        body=re.sub(r'\s+\d+\s*[.—–-]\s*$', '',text[start:stop]).strip()
        # Preserve citation numbers and facts in research, not a claim of verification.
        sections[field]=body
    annotation_urls = set()
    for page in reader.pages:
        for ref in page.get('/Annots', []):
            action = ref.get_object().get('/A', {})
            uri = action.get('/URI')
            if uri and str(uri).startswith(('http://', 'https://')):
                annotation_urls.add(str(uri))
    bibliography=text[refs_pos+len('Alıntılanan çalışmalar'):]
    references=[]
    for match in re.finditer(r'(?:^|\s)(\d+)\.\s+(.*?)(?=\s\d+\.\s+|$)',bibliography):
        number=int(match.group(1)); entry=match.group(2)
        urlmatch=re.search(r'https?://\S+',entry)
        if not urlmatch: continue
        url=urlmatch.group(0).rstrip('.,;')
        if url not in annotation_urls:
            candidates = [value for value in annotation_urls if value.startswith(url)]
            if len(candidates) == 1: url = candidates[0]
            else: continue  # Never guess a wrapped or ambiguous PDF link.
        title=entry[:urlmatch.start()].strip(' ,')
        host=urlparse(url).hostname
        if not host: continue
        supported=[field for field,body in sections.items() if re.search(r'(?<!\d)'+str(number)+r'(?!\d)',body)]
        # A hostname identifies the actual hosting publisher; never trust the PDF's TÜİK label.
        references.append(dict(title=title or host,publisher=host,url=url,sourceType='unclassified',primary=False,needsVerification=True,sections=supported))
    represented = {source['url'] for source in references}
    for url in sorted(annotation_urls - represented):
        host = urlparse(url).hostname
        if host:
            references.append(dict(title='PDF bağlantısı: '+host,publisher=host,url=url,sourceType='unclassified',primary=False,needsVerification=True,sections=[]))
    if not references: raise ValueError(f'{name}: no parsable references')
    return dict(district=slug,name=name,document=dict(file=unicodedata.normalize('NFC',path.name),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),pages=len(pages)),sections=sections,sources=references,sourceAppendix=text[last_end:],reviewedSections=[],needsVerification=True)

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--pdf-dir',type=Path,required=True); parser.add_argument('--output',type=Path,required=True); args=parser.parse_args()
    registry=(ROOT/'src/content/districts/district-registry.ts').read_text()
    districts=re.findall(r'\["([^"]+)", "([a-z-]+)", [\d.]+, [\d.]+\]',registry)
    if len(districts)!=39 or len({s for _,s in districts})!=39: raise ValueError('Expected 39 unique registry districts')
    files=list(args.pdf_dir.glob('*.pdf')); records=[]
    for name,slug in districts:
        matches=[p for p in files if unicodedata.normalize('NFC',p.name).startswith(name+' İlçe')]
        if len(matches)!=1: raise ValueError(f'{name}: expected exactly one PDF, found {len(matches)}')
        records.append(convert(matches[0],name,slug))
    result=dict(schemaVersion=1,publicationStatus='draft-only-unverified-research',districts=records)
    args.output.parent.mkdir(parents=True,exist_ok=True); args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(dict(districts=len(records),pages=sum(r['document']['pages'] for r in records),sources=sum(len(r['sources']) for r in records),output=str(args.output)),ensure_ascii=False))
if __name__=='__main__': main()
