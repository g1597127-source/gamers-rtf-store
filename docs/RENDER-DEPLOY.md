# Deploy da Gamers RTF na Render

## O que você precisa criar

Crie uma conta gratuita na [Render](https://render.com/) e conecte o repositório GitHub que contém o projeto. A Render cria primeiro um endereço gratuito no formato `https://nome-do-servico.onrender.com`. O domínio próprio pode ser conectado depois, sem precisar recriar o serviço.

O projeto já inclui `Dockerfile`, `render.yaml` e `.dockerignore`. Você pode fazer o deploy usando o Blueprint da Render ou criar um Web Service manualmente.

## Opção recomendada: Blueprint

1. Suba a pasta do projeto para um repositório GitHub privado ou público.
2. Na Render, clique em **New > Blueprint**.
3. Selecione o repositório.
4. A Render vai ler o arquivo `render.yaml` e criar o Web Service.
5. Preencha as variáveis solicitadas no painel.
6. Clique em **Apply** e aguarde o build.

O serviço usa o `Dockerfile`, executa as migrações do Drizzle e inicia o servidor Node em produção. A porta é lida automaticamente da variável `PORT` fornecida pela Render.

## Variáveis obrigatórias

| Variável | Valor |
|---|---|
| `DATABASE_URL` | String de conexão MySQL/TiDB Cloud com TLS, se exigido pelo provedor |
| `MP_ACCESS_TOKEN` | Access Token privado do Mercado Pago; nunca coloque no frontend |
| `VITE_MERCADO_PAGO_PUBLIC_KEY` | Public Key do Mercado Pago |
| `PUBLIC_APP_URL` | Primeiro use a URL `onrender.com`; depois substitua pelo domínio definitivo |
| `JWT_SECRET` | Pode ser gerada automaticamente pelo `render.yaml` |

## Variáveis da autenticação Manus

Se a loja continuar usando o login Manus, mantenha também `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `OWNER_OPEN_ID` e `OWNER_NAME`. Se a loja for usada somente como vitrine pública, o checkout continua público, mas a área administrativa precisa da autenticação configurada.

## Banco de dados

O banco utilizado pelo projeto é MySQL-compatible. Uma alternativa gratuita inicial é o TiDB Cloud Starter. Crie a instância, copie a string de conexão TLS e salve-a na Render como `DATABASE_URL`.

Não use o filesystem da Render para guardar pedidos: o filesystem de serviços gratuitos é temporário. Os pedidos ficam no banco de dados.

## Domínio próprio

Depois do primeiro deploy:

1. Abra o serviço na Render.
2. Acesse **Settings > Custom Domains**.
3. Adicione o domínio desejado.
4. A Render informará o registro DNS que deve ser criado no provedor do domínio.
5. Aguarde a propagação e a emissão automática do certificado SSL.
6. Atualize `PUBLIC_APP_URL` para `https://seu-dominio.com`.
7. Faça um novo deploy.

## Mercado Pago e webhook

Depois que o domínio final estiver funcionando, configure no painel do Mercado Pago a URL:

```text
https://seu-dominio.com/api/mercadopago/webhook
```

Se o Mercado Pago oferecer uma assinatura secreta para o webhook, salve-a na Render como `MERCADO_PAGO_WEBHOOK_SECRET`.

O Access Token deve ficar somente em `MP_ACCESS_TOKEN` no painel da Render. Não coloque esse valor em `VITE_*`, no GitHub, no ZIP ou no código do navegador.

## Teste após o deploy

1. Abra a URL da Render.
2. Adicione um produto ao carrinho.
3. Preencha um CPF válido e uma data de nascimento real do comprador.
4. Clique em **Continuar para pagamento**.
5. Confirme se o Checkout Pro abre.
6. Verifique no painel do Mercado Pago se a preferência foi criada.
7. Faça um teste de retorno aprovado, pendente e recusado.
8. Consulte o pedido pelo rastreio da loja.

## Limitações do plano gratuito

A Render informa que serviços Web gratuitos entram em repouso após 15 minutos sem tráfego e podem levar aproximadamente um minuto para voltar. O plano é apropriado para testes e início da operação, mas não é o ideal para uma loja com vendas constantes. Quando houver tráfego real, considere migrar o Web Service para um plano pago.
