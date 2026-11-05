import sys,glob,os,re
def load(d):
    out={}
    for f in glob.glob(d+'/assets/*.css'):
        name=re.sub(r'-[A-Za-z0-9_-]{8}\.css$','',os.path.basename(f))
        out[name]=open(f).read()
    return out
a,b=load(sys.argv[1]),load(sys.argv[2])
print('only before',sorted(set(a)-set(b)),'only after',sorted(set(b)-set(a)))
for k in sorted(set(a)&set(b)):
    if a[k]!=b[k]:
        x,y=a[k],b[k]; i=0
        while i<min(len(x),len(y)) and x[i]==y[i]: i+=1
        print('DIFF',k,len(x),len(y),'at',i); print('  before:',x[max(0,i-80):i+120]); print('  after: ',y[max(0,i-80):i+120])
    else: print('same',k)
