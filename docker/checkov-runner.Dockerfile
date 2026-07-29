# Runner isolado do Checkov usado pelo CloudGuardian para escanear IaC de
# clientes. É um wrapper fino sobre a imagem oficial, fixado por digest em
# produção para reprodutibilidade. A API invoca este container com:
#
#   docker run --rm --network none --read-only \
#     --security-opt no-new-privileges --memory 512m --cpus 1 \
#     -v <tmpdir>:/tf:ro cloudguardian/checkov-runner -d /tf -o json --compact
#
# O código do cliente é montado read-only, sem rede e sem privilégios — nunca
# executa no processo da API.
FROM bridgecrew/checkov:latest

# Roda como usuário não-root (a imagem base já cria o usuário)
USER checkov

ENTRYPOINT ["checkov"]
