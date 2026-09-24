# Notas de integração dos Correios

Fontes oficiais consultadas em 24/09/2026:

- API Preço: https://www.correios.com.br/atendimento/developers/manuais/manual-api-preco-1
- API Prazo: https://www.correios.com.br/atendimento/developers/manuais/manual-api-prazo
- Portal de desenvolvedores: https://www.correios.com.br/atendimento/developers

A documentação oficial informa que a API Preço exige contrato ativo e o serviço 38202 API PREÇOS, enquanto a API Prazo exige o serviço 38210 API PRAZOS. A autenticação usa Bearer Token. Os endpoints de produção documentados são `https://api.correios.com.br/preco/v1` e `https://api.correios.com.br/prazo/v1` para as consultas implementadas no backend. Os códigos indicados no manual para SEDEX e PAC são 03220 e 03298. Durante a fase de testes da loja, a interface usa frete grátis e não chama a cotação dos Correios.
