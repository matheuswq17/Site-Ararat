# Montagem das comparações da 1ª tela (base × A × refinada) a partir de tests/capture-tipografia.mjs.
#   python3 tests/montagem-comparacao.py   (depois de: ROUTES=base:/previa,a:/previa/a,refinada:/previa/refinada VPS=... node tests/capture-tipografia.mjs screenshots/previa-refinada/tipografia)
import sys
from PIL import Image, ImageDraw, ImageFont
src="screenshots/previa-refinada/tipografia"; out="screenshots/previa-refinada"
try: F=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",22); f2=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",17)
except: F=f2=None
labels={"base":"/previa — base 0.2.1 (Montserrat/Open Sans)","a":"/previa/a — proposta A","refinada":"/previa/refinada — versão conjunta"}
for vp in ["1280x720","1440x900","768x1024","390x844","320x568"]:
    w=vp.split("x")[0]; ims=[Image.open(f"{src}/{w}-{r}-1-hero.png").convert("RGB") for r in labels]
    sc=min(1.0, (1500 if int(w)>700 else 520)/ims[0].width); ims=[i.resize((int(i.width*sc),int(i.height*sc))) for i in ims]
    W=sum(i.width for i in ims)+20*(len(ims)+1); H=ims[0].height+110
    c=Image.new("RGB",(W,H),(245,247,250)); d=ImageDraw.Draw(c); x=20
    for (k,t),i in zip(labels.items(),ims):
        c.paste(i,(x,94)); d.text((x,14),t,fill=(13,27,42),font=F if int(w)>700 else f2); d.text((x,44),vp+" · 1ª tela",fill=(80,90,100),font=f2)
        if k=="refinada": d.text((x,66),"arte: montanha B 0.4.0-draft (Motion)",fill=(150,60,40),font=f2)
        x+=i.width+20
    c.save(f"{out}/comparacao-{vp}.png"); print(vp,c.size)
