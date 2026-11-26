# Textos para a submissão no Hack Brasil 2026

Rascunho preparado em 26/11/2026 para o Nabo revisar e colar no formulário.
A senha das contas de demonstração **não** está aqui: ela vai só no formulário.

## Nome do projeto

Mecenas

## Trilha

Cultura & economia criativa

## Pitch (uma frase)

Mecenas é uma plataforma gratuita de encomenda de ilustrações em que o artista
nunca trabalha sem uma oferta aceita e paga, e a plataforma não cobra nada dele.

## Descrição

**Problema.** Ilustradores independentes no Brasil perdem trabalho e dinheiro
com clientes que somem, não pagam ou pedem "testes" gratuitos. Sites de
concurso fazem muitos artistas trabalharem de graça para que só um receba.

**Solução.** No Mecenas, o cliente descreve a ideia e define um valor por
artista. Os artistas apenas se candidatam: ninguém desenha antes de uma oferta
aceita. O cliente escolhe artistas e monta uma fila de reserva; cada oferta tem
24 horas de resposta e, se for recusada ou expirar, segue para o próximo da
fila. Quando o artista aceita, o cliente paga um Pix e o valor fica reservado
antes do primeiro traço.

A entrega vem com prévia com marca d'água e imagens do processo. O cliente tem
duas revisões e 72 horas para avaliar cada versão; sem resposta, a entrega é
aprovada automaticamente e o repasse é liberado. Na aprovação, o cliente baixa
o arquivo final com uma licença de uso escrita. Se o cliente suspeitar de uso
de IA, a contestação vai para revisão humana da plataforma, não para o
cliente: se for acolhida, o cliente é reembolsado e não fica com o arquivo; se
não, o artista recebe. Perfis mostram fatos de reputação (encomendas
concluídas, contestações acolhidas), não só estrelas. Taxa para artistas: zero.

**O que funciona hoje.** Todo o fluxo acima, em português, com dados
fictícios. Em ambiente de desenvolvimento, um Pix real em modo de teste da
AbacatePay foi confirmado pelo webhook do provedor, e uma contestação acolhida
terminou em reembolso confirmado no sandbox. Na demonstração pública, os
pagamentos são de demonstração e estão identificados na tela.

**Limites, com honestidade.** O repasse ao artista é simulado: no sandbox, o
reembolso não desfaz o split para a subconta, então não afirmamos custódia
real. Em produção, o Mecenas usaria um provedor de custódia licenciado.

**Tecnologia.** Next.js (App Router, TypeScript), Convex (banco, funções
agendadas para os prazos e armazenamento de arquivos), Vercel e AbacatePay em
modo de teste. Desenvolvido com agentes de IA e com o Anvil, o fluxo de
trabalho do autor, que não faz parte da aplicação.

## Link do repositório

https://github.com/belther/mecenas

## Link da demonstração

https://mecenas-azure.vercel.app

Para avaliar: abra https://mecenas-azure.vercel.app/painel e entre com uma das
contas abaixo. Senha: **[colar aqui só no formulário]**.

| Conta | Papel | O que ver |
| --- | --- | --- |
| `demo-cliente` | Cliente | Encomendas A–F: escolher artistas, avaliar entregas, baixar arquivo e licença |
| `demo-artista-iara` | Artista | Oferta para aceitar ou recusar; entrega em avaliação |
| `demo-artista-tomas` | Artista | Fila de reserva; entrega aprovada |
| `demo-artista-bento` | Artista | Entrega contestada por uso de IA |
| `demo-revisor` | Plataforma | Decidir a contestação de uso de IA |

Observação para quem avalia: as contas são compartilhadas. Por segurança, cada
conta aceita poucas entradas seguidas (depois, uma por minuto). Se aparecer
"Muitas tentativas", aguarde um minuto ou use outra conta.

## Vídeo

[link do vídeo final, quando gravado]
