<script>import { Exchange, ExchangeCard } from '@microcks/deep-ink'; const BODY = `{
  "name": "Eclair Cafe",
  "description": "Delicieux Eclair au Cafe pas calorique du tout",
  "size": "M",
  "price": 2.5,
  "status": "available"
}`;</script>{#snippet request()}<ExchangeCard title="Request" label="Request of Eclair Cafe" meta="Eclair Cafe" blocks={[{label:'Request line',text:'GET /rest/API+Pastry/2.0/pastries/Eclair%20Cafe',tone:'secondary'},{label:'Parameters',text:'name = Eclair Cafe',tone:'params'}]}/>{/snippet}{#snippet response()}<ExchangeCard title="Response" label="Response of Eclair Cafe" status="200 OK" blocks={[{label:'Response headers',text:'Content-Type: application/json',tone:'headers'},{label:'Response body',text:BODY,grow:true}]}/>{/snippet}<Exchange style="max-width:900px" children={[request,response]}/>
