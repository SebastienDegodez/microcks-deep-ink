<script>import { Exchange, ExchangeCard } from '@microcks/deep-ink'; const BODY = `{
  "name": "Eclair Cafe",
  "description": "Delicieux Eclair au Cafe pas calorique du tout",
  "size": "M",
  "price": 2.5,
  "status": "available"
}`;</script>{#snippet request()}<ExchangeCard size="sm" title="Request" label="Request of Millefeuille" blocks={[{label:'Request line',text:'GET /pastries/Millefeuille',tone:'secondary'},{label:'Parameters',text:'name = Millefeuille',tone:'params'}]}/>{/snippet}{#snippet response()}<ExchangeCard size="sm" title="Response" label="Response of Millefeuille" status="200 · application/json" blocks={[{label:'Response body',text:BODY,grow:true}]}/>{/snippet}<Exchange separator={false} style="max-width:900px" children={[request,response]}/>
