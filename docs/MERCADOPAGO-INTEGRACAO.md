# Integração Mercado Pago — Gamers RTF

## Visão geral

A Gamers RTF agora possui a estrutura de backend necessária para iniciar pagamentos pelo **Mercado Pago Checkout Pro** sem confiar em preços enviados pelo navegador. O cliente envia apenas os identificadores dos produtos e as quantidades; o servidor valida esses dados contra o catálogo canônico, grava um pedido pendente no banco, cria uma preferência no Mercado Pago e redireciona o comprador para o checkout hospedado pelo próprio Mercado Pago.

O retorno do navegador nunca é tratado como prova de pagamento. A confirmação real acontece pelo webhook, que consulta o pagamento diretamente na API do Mercado Pago usando o Access Token e atualiza o pedido no banco.

## O que foi criado

| Camada | Implementação | Objetivo |
| --- | --- | --- |
| Catálogo | `shared/storeCatalog.ts` | Fonte de verdade de nomes, IDs e preços no servidor. |
| Banco | `orders` e `orderItems` | Persistir pedidos, itens, valores, preferência e status do pagamento. |
| Checkout | `server/mercadopago.ts` | Criar a preferência do Checkout Pro com idempotência e URLs de retorno. |
| Webhook | `POST /api/mercadopago/webhook` | Receber notificações e consultar o status real do pagamento. |
| API interna | `checkout.createPreference` | Expor ao frontend uma operação tipada para iniciar o checkout. |
| Frontend | Carrinho e página de produto | Botões “Ir para checkout” e “Comprar agora” conectados ao backend. |
| Retornos | `/pagamento/sucesso`, `/pagamento/pendente`, `/pagamento/falhou` | Apresentar estados claros após o retorno do Mercado Pago. |

## Credenciais necessárias

### Obrigatórias para iniciar checkout

| Variável | Onde fica | Finalidade |
| --- | --- | --- |
| `VITE_MERCADO_PAGO_PUBLIC_KEY` | Variável pública do projeto | Fica preparada para MercadoPago.js/Checkout Bricks e futuras experiências no navegador. Não substitui o Access Token. |
| `MERCADO_PAGO_ACCESS_TOKEN` | Secret privado do servidor | Cria preferências, consulta pagamentos e nunca deve ser exposto no frontend. |

### Recomendada para produção

| Variável | Finalidade |
| --- | --- |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Valida a assinatura HMAC enviada pelo Mercado Pago no header `x-signature`. |

A implementação continua capaz de consultar o pagamento diretamente com o Access Token quando o segredo do webhook ainda não foi preenchido, mas a recomendação é configurar o `MERCADO_PAGO_WEBHOOK_SECRET` antes de colocar a loja em produção.

### Opcional

| Variável | Finalidade |
| --- | --- |
| `PUBLIC_APP_URL` | Domínio público usado nas URLs de retorno e no `notification_url`. Em desenvolvimento, o sistema deriva a origem da requisição. Em produção, informe o domínio HTTPS definitivo. |

## Como configurar

1. No painel de desenvolvedores do Mercado Pago, crie uma aplicação para a Gamers RTF.
2. Comece com as credenciais de teste. O Checkout Pro cria uma preferência a cada pedido.
3. Adicione `VITE_MERCADO_PAGO_PUBLIC_KEY` e `MERCADO_PAGO_ACCESS_TOKEN` nos secrets do projeto.
4. Opcionalmente, adicione `MERCADO_PAGO_WEBHOOK_SECRET` copiando a assinatura secreta exibida em **Webhooks > Configurar notificações**.
5. Em produção, configure `PUBLIC_APP_URL` com o domínio HTTPS da loja, por exemplo `https://www.gamersrtf.com.br`.
6. No painel do Mercado Pago, configure a URL de Webhook como:

```text
https://SEU_DOMINIO/api/mercadopago/webhook
```

7. Ative o evento **Pagamentos**.
8. Teste o fluxo completo com usuários e credenciais de teste do Mercado Pago.
9. Quando tudo estiver validado, troque as credenciais de teste pelas credenciais produtivas e atualize a URL produtiva do webhook.

## Fluxo técnico

```text
Carrinho / Comprar agora
        |
        v
checkout.createPreference (tRPC)
        |
        | valida IDs e quantidades
        | recalcula preços no servidor
        | cria orders + orderItems como pending
        v
Mercado Pago Preference API
        |
        v
sandbox_init_point / init_point
        |
        v
Checkout hospedado do Mercado Pago
        |
        +--> retorno visual: /pagamento/sucesso|pendente|falhou
        |
        +--> POST webhook: /api/mercadopago/webhook
                    |
                    | valida x-signature se configurado
                    | consulta GET /v1/payments/:id
                    | confere external_reference
                    v
              atualiza orders.status
```

## Segurança implementada

O preço não é aceito do frontend. O navegador envia `productId` e `quantity`, e o backend busca os valores em `shared/storeCatalog.ts`.

O Access Token é lido apenas em `server/_core/env.ts` e usado em `server/mercadopago.ts`. Ele não aparece no bundle React.

Cada preferência usa uma `external_reference` única e uma chave de idempotência. Isso reduz o risco de criar duas operações quando uma requisição é repetida.

O webhook não marca o pedido como aprovado apenas por receber uma notificação. Ele consulta o pagamento na API do Mercado Pago, obtém o status oficial e só atualiza o pedido cujo `external_reference` corresponde ao pedido criado pela loja.

Quando `MERCADO_PAGO_WEBHOOK_SECRET` estiver configurado, a assinatura HMAC do header `x-signature` é validada com comparação segura. O endpoint responde `200` somente depois de processar ou ignorar corretamente a notificação; em caso de falha transitória, retorna `500` para permitir nova tentativa do Mercado Pago.

## Estrutura de dados

### `orders`

Guarda a referência externa da loja, o valor total em centavos, o status interno, o ID da preferência, o ID do pagamento e o status detalhado retornado pelo Mercado Pago.

### `orderItems`

Guarda uma fotografia dos itens no momento da compra: produto, título, quantidade e preço unitário em centavos. Assim, uma alteração futura no catálogo não muda o histórico do pedido.

## Opções avaliadas

| Abordagem | Trade-offs | Custo | Complexidade |
| --- | --- | --- | --- |
| Checkout Pro com backend, banco e webhook — escolhida | Redireciona para o ambiente seguro do Mercado Pago; oferece Pix, cartão e boleto; exige secrets, banco e webhook. | Taxas do Mercado Pago por transação; infraestrutura conforme hospedagem. | Média, com melhor equilíbrio para uma loja real. |
| Link de pagamento manual | Muito rápido para começar; cada cobrança precisa ser criada/gerenciada fora do carrinho e o pedido não fica integrado ao catálogo. | Taxas do Mercado Pago; menor custo inicial de desenvolvimento. | Baixa, mas limitada para automação e escala. |
| Checkout Bricks / API de pagamentos | Experiência mais integrada dentro do site; exige mais responsabilidades de frontend, tokenização e testes de meios de pagamento. | Taxas do Mercado Pago; maior custo de desenvolvimento e manutenção. | Alta; recomendado como próxima evolução, não como primeiro checkout. |

## O que ainda depende de configuração externa

A estrutura de código está pronta, mas o checkout real só poderá abrir depois que as credenciais forem cadastradas. O webhook também precisa ser configurado no painel do Mercado Pago com a URL pública HTTPS.

Os produtos ainda usam o catálogo demonstrativo existente. Antes de vender de verdade, revise preços, estoque, frete, dados comerciais, política de troca, política de privacidade, emissão fiscal e atendimento.

O checkout atual não calcula frete nem coleta endereço dentro da Gamers RTF. Esses dados podem ser tratados no Mercado Pago ou adicionados como uma segunda etapa antes da criação da preferência, conforme a operação da loja.

## Checklist de publicação

- [ ] Cadastrar `VITE_MERCADO_PAGO_PUBLIC_KEY`.
- [ ] Cadastrar `MERCADO_PAGO_ACCESS_TOKEN` como secret privado.
- [ ] Cadastrar `MERCADO_PAGO_WEBHOOK_SECRET` em produção.
- [ ] Definir `PUBLIC_APP_URL` com HTTPS.
- [ ] Configurar Webhook de pagamentos no painel do Mercado Pago.
- [ ] Testar aprovação, pendência, rejeição e cancelamento.
- [ ] Confirmar que o status do pedido é atualizado no banco.
- [ ] Revisar catálogo, estoque, frete e informações legais.
- [ ] Trocar credenciais de teste pelas produtivas somente após os testes.

## Referências oficiais

- [Criar e configurar uma preferência de pagamento — Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/create-payment-preference)
- [Configurar notificações de pagamento — Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/payment-notifications)
- [Webhooks e validação de assinatura — Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/additional-content/notifications/webhooks)
- [SDK oficial Node.js do Mercado Pago](https://github.com/mercadopago/sdk-nodejs)

## Limites do escopo atual

Esta entrega prepara a integração e o fluxo técnico, mas não configura credenciais de produção, não realiza compra real e não substitui a validação comercial, fiscal ou jurídica da operação. O botão de checkout está ligado ao backend e pronto para abrir o Checkout Pro assim que as credenciais forem fornecidas.
