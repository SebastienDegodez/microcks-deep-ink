<script>import { Exchange, ExchangeCard } from '@microcks/deep-ink'; const BODY = `{
  "name": "Eclair Cafe",
  "description": "Delicieux Eclair au Cafe pas calorique du tout",
  "size": "M",
  "price": 2.5,
  "status": "available"
}`;</script><div class="sb-col" style="max-width:560px"><ExchangeCard title="Response" label="Response, warning" headingLevel={3} status="200 · slow" statusTone="warning" blocks={[{label:'Slow response body',text:'{ "name": "Millefeuille" }'}]}/><ExchangeCard title="Response" label="Response, failure" headingLevel="none" status="500" statusTone="danger" blocks={[{label:'Error body',text:'{ "error": "boom" }'}]}/></div>
