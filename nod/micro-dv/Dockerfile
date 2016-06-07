FROM shippabledocker/box-mono:_global.master.latest

ADD . /home/demo/dv/

RUN cd /home/demo/dv && npm install

ENTRYPOINT ["/home/demo/dv/boot.sh"]
