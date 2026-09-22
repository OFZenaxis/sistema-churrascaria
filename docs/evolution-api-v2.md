Primeiros Passos
Instalação da Evolution API
Escolha o método de instalação ideal para seu cenário

Este guia irá ajudá-lo a instalar e configurar a Evolution API, nossa API REST principal para integração com WhatsApp.
​
Pré-requisitos
Antes de iniciar, configure os serviços de infraestrutura necessários:
Banco de Dados
PostgreSQL ou MySQL com Prisma ORM
Redis
Cache distribuído para alta performance
​
Métodos de instalação
Escolha o método mais adequado para o seu cenário:
Docker
Recomendado para produção. Inclui Docker Compose standalone e Docker Swarm com Traefik para alta disponibilidade.
NVM
Instalação local com Node Version Manager. Ideal para desenvolvimento ou quando você precisa de controle total sobre o ambiente.
Nginx e SSL
Configuração de proxy reverso com Nginx e certificado SSL via Let’s Encrypt.
SetupOrion
Instalador automatizado com Traefik, Portainer e Docker Swarm. Ideal para VPS limpa.
Easypanel
Painel de controle baseado em Docker com template 1-clique e SSL automático. Ideal para quem quer simplicidade sem abrir mão do self-hosted.
​
Verificação rápida
Após instalar por qualquer método, verifique se a API está funcionando:
​
Teste de saúde
curl http://localhost:8080/
​
Crie sua primeira instância WhatsApp
curl -X POST http://localhost:8080/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: sua-chave-segura-aqui" \
  -d '{
    "instanceName": "minha-instancia",
    "integration": "WHATSAPP-BAILEYS",
    "qrcode": true
  }'
​
Obtenha o QR Code para conectar
curl http://localhost:8080/instance/connect/minha-instancia \
  -H "apikey: sua-chave-segura-aqui"
Escaneie o QR Code com o WhatsApp do seu celular para conectar a instância.
​
Verifique o status da conexão
curl http://localhost:8080/instance/connectionState/minha-instancia \
  -H "apikey: sua-chave-segura-aqui"
​
Próximos passos
Variáveis de Ambiente
Referência completa de todas as variáveis de configuração
Webhooks
Configure webhooks para receber eventos em tempo real
Integrações
Conecte com Chatwoot, Typebot, OpenAI, Dify e mais
Atualização
Mantenha sua instância sempre atualizada

Banco de Dados
O banco de dados é uma parte fundamental da Evolution API v2, responsável por armazenar todas as informações críticas da aplicação. A API suporta tanto PostgreSQL quanto MySQL, utilizando o Prisma como ORM (Object-Relational Mapping) para facilitar a interação com esses bancos de dados.
​
Escolha do Banco de Dados
A Evolution API v2 permite a flexibilidade de escolher entre PostgreSQL e MySQL como provedor de banco de dados. A escolha pode ser configurada através da variável de ambiente DATABASE_PROVIDER e as conexões são gerenciadas pelo Prisma.
​
Instalação e Configuração
​
Utilizando Docker
A maneira mais fácil e rápida de configurar um banco de dados para a Evolution API v2 é através do Docker. Abaixo estão as instruções para configurar tanto o PostgreSQL quanto o MySQL usando Docker Compose.
​
PostgreSQL
Para configurar o PostgreSQL via Docker, siga os passos abaixo:
Baixe o arquivo docker-compose.yaml para o PostgreSQL disponível aqui.
Navegue até o diretório onde o arquivo foi baixado e execute o comando:
docker-compose up -d
A instância do PostgreSQL estará disponível no endereço localhost na porta 5432.
​
MySQL
Para configurar o MySQL via Docker, siga os passos abaixo:
Baixe o arquivo docker-compose.yaml para o MySQL disponível aqui.
Navegue até o diretório onde o arquivo foi baixado e execute o comando:
docker-compose up -d
A instância do MySQL estará disponível no endereço localhost na porta 3306.
​
Configuração das Variáveis de Ambiente
Após configurar o banco de dados, defina as seguintes variáveis de ambiente no seu arquivo .env:
# Habilitar o uso do banco de dados
DATABASE_ENABLED=true

# Escolher o provedor do banco de dados: postgresql ou mysql
DATABASE_PROVIDER=postgresql

# URI de conexão com o banco de dados
DATABASE_CONNECTION_URI='postgresql://user:pass@localhost:5432/evolution?schema=public'

# Nome do cliente para a conexão do banco de dados
DATABASE_CONNECTION_CLIENT_NAME=evolution_exchange

# Escolha os dados que você deseja salvar no banco de dados da aplicação
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=true
DATABASE_SAVE_MESSAGE_UPDATE=true
DATABASE_SAVE_DATA_CONTACTS=true
DATABASE_SAVE_DATA_CHATS=true
DATABASE_SAVE_DATA_LABELS=true
DATABASE_SAVE_DATA_HISTORIC=true
​
Instalação Local
Caso prefira configurar o banco de dados localmente sem utilizar Docker, siga as instruções abaixo:
​
PostgreSQL
Instale o PostgreSQL na sua máquina. Em sistemas baseados em Ubuntu, por exemplo, você pode usar:
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
Inicie o serviço do PostgreSQL:
sudo service postgresql start
Crie um banco de dados para a Evolution API v2:
sudo -u postgres createdb evolution
​
MySQL
Instale o MySQL na sua máquina. Em sistemas baseados em Ubuntu, você pode usar:
sudo apt-get update
sudo apt-get install mysql-server
Inicie o serviço do MySQL:
sudo service mysql start
Crie um banco de dados para a Evolution API v2:
mysql -u root -p -e "CREATE DATABASE evolution;"

Redis
O Redis é utilizado pela Evolution API v2 como um sistema de cache para otimizar o desempenho e a velocidade da aplicação. Ele pode ser configurado para armazenar informações temporárias e melhorar a eficiência das operações.
​
Instalação e Configuração
​
Utilizando Docker
A maneira mais fácil e rápida de configurar o Redis para a Evolution API v2 é através do Docker. Abaixo estão as instruções para configurar o Redis usando Docker Compose.
​
Redis
Para configurar o Redis via Docker, siga os passos abaixo:
Baixe o arquivo docker-compose.yaml para o Redis disponível aqui.
Navegue até o diretório onde o arquivo foi baixado e execute o comando:
docker-compose up -d
A instância do Redis estará disponível no endereço localhost na porta 6379.
​
Configuração das Variáveis de Ambiente
Após configurar o Redis, defina as seguintes variáveis de ambiente no seu arquivo .env:
# Habilitar o cache Redis
CACHE_REDIS_ENABLED=true

# URI de conexão com o Redis
CACHE_REDIS_URI=redis://localhost:6379/6

# Prefixo para diferenciar os dados de diferentes instalações que utilizam o mesmo Redis
CACHE_REDIS_PREFIX_KEY=evolution

# Habilitar para salvar as informações de conexão no Redis ao invés do banco de dados
CACHE_REDIS_SAVE_INSTANCES=false

# Habilitar o cache local
CACHE_LOCAL_ENABLED=false
​
Instalação Local
Caso prefira configurar o Redis localmente sem utilizar Docker, siga as instruções abaixo:
​
Redis
Instale o Redis na sua máquina. Em sistemas baseados em Ubuntu, por exemplo, você pode usar:
sudo apt-get update
sudo apt-get install redis-server
Inicie o serviço do Redis:
sudo service redis-server start
Verifique se o Redis está rodando corretamente com o comando:
redis-cli ping
Se tudo estiver funcionando corretamente, você verá a resposta PONG.
​
Configuração do Cache na Evolution API v2
Após a instalação e configuração do Redis, a próxima etapa é configurar o cache na Evolution API v2 utilizando as variáveis de ambiente. Isso permitirá que a API utilize o Redis para cachear dados importantes e melhorar a performance geral da aplicação.

Docker
Pré-requisitos: Antes de prosseguir com a instalação da Evolution API v2 utilizando Docker, certifique-se de que você já tenha configurado os serviços necessários, como PostgreSQL e Redis. Siga os links abaixo para mais detalhes:
Configuração do Banco de Dados
Configuração do Redis
Estas instruções de instalação assumem que você já instalou o Docker em sua máquina. Você pode encontrar informações sobre como instalar o Docker na Documentação Oficial do Docker.
A Evolution API v2 está pronta para o Docker e pode ser facilmente implantada com Docker no modo standalone ou swarm. O repositório oficial do Evolution API contém todos os arquivos de composição necessários para instalar e executar a API.
​
Docker Compose
Implantar a Evolution API v2 usando o Docker Compose simplifica a configuração e o gerenciamento de seus contêineres Docker. Ele permite que você defina seu ambiente Docker em um arquivo docker-compose.yaml e, em seguida, use um único comando para iniciar tudo.
​
Arquivo Docker Compose
O exemplo a seguir ilustra como configurar o Docker Compose para ambientes standalone, ou seja, um único servidor em execução. Para a sincronização de dois servidores em paralelo ou maior escalabilidade, utilize o Docker Swarm, recomendado para usuários mais avançados.
​
Configuração Standalone
Atenção: Os comandos aqui descritos como docker compose, podem não funcionar em versões mais antigas do Docker. Caso você esteja usando uma versão mais antiga, substitua por docker-compose.
O Docker standalone é adequado quando a Evolution API será executada em apenas uma máquina, sem a necessidade de escalabilidade imediata. Esta é a forma mais conveniente para a maioria dos usuários.
Para começar, crie um arquivo docker-compose.yml com o seguinte conteúdo:
version: '3.9'
services:
  evolution-api:
    container_name: evolution_api
    image: evoapicloud/evolution-api:v2.1.1
    restart: always
    ports:
      - "8080:8080"
    env_file:
      - .env
    volumes:
      - evolution_instances:/evolution/instances

volumes:
  evolution_instances:
Em seguida, crie um arquivo .env no mesmo diretório com o seguinte conteúdo mínimo:
AUTHENTICATION_API_KEY=mude-me
Para mais configurações, você pode pegar o arquivo de exemplo no repositório oficial. Confira também o guia de variáveis de ambiente aqui.
​
Inicializando a API
Navegue até o diretório que contém o arquivo docker-compose.yml e execute o seguinte comando para iniciar os serviços definidos no arquivo:
docker compose up -d
Esse comando baixará as imagens Docker necessárias, criará os serviços, redes e volumes definidos, e iniciará o serviço da Evolution API.
​
Verificando os Logs
Após executar o comando docker compose up, você pode verificar os logs para confirmar se os serviços estão em execução corretamente:
docker logs evolution_api
​
Parando o Serviço
Para parar o serviço, utilize o comando:
docker compose down
​
Acessando a API
Abra seu navegador e acesse http://localhost:8080 para verificar se a Evolution API está operacional.
​
Docker Swarm
Para configurar e gerenciar um cluster Docker Swarm para a Evolution API v2, siga as instruções abaixo. O Docker Swarm é ideal para ambientes que exigem escalabilidade e alta disponibilidade.
​
Instalação do Docker Swarm
​
Configurando o Servidor Manager
Se estiver utilizando um servidor da Hetzner, execute:
sudo apt-get update && apt-get install -y apparmor-utils
Etapa 1: Configuração do Hostname
Mude o hostname da máquina para identificá-la no cluster:
hostnamectl set-hostname manager1
Edite o arquivo /etc/hosts para adicionar o novo nome:
nano /etc/hosts
Adicione a linha:
127.0.0.1    manager1
Reinicie o sistema para aplicar as alterações:
reboot
Verifique o hostname:
hostnamectl
Etapa 2: Instalação do Docker
Instale o Docker executando:
curl -fsSL https://get.docker.com | bash
Etapa 3: Iniciando o Swarm
Inicie o Docker Swarm:
docker swarm init --advertise-addr IP_SERVER
Etapa 4: Configuração da Rede do Docker Swarm
Crie a rede overlay para o Docker Swarm:
docker network create --driver=overlay network_public
Anote o comando gerado para registrar os Workers:
docker swarm join --token HASH IP_SERVER:2377
​
Configurando o Servidor Worker
Se estiver utilizando um servidor da Hetzner, execute:
sudo apt-get update && apt-get install -y apparmor-utils
Etapa 1: Configuração do Hostname
Mude o hostname da máquina para identificá-la no cluster:
hostnamectl set-hostname worker1
Edite o arquivo /etc/hosts para adicionar o novo nome:
nano /etc/hosts
Adicione a linha:
127.0.0.1    worker1
Reinicie o sistema para aplicar as alterações:
reboot
Etapa 2: Instalação do Docker
Instale o Docker executando:
curl -fsSL https://get.docker.com | bash
Etapa 3: Adicionar o Worker ao Cluster
Execute o comando obtido anteriormente para adicionar o Worker ao cluster:
docker swarm join --token HASH IP_SERVER:2377
​
Pré-requisitos para a Evolution API via Swarm
​
Instalação do Traefik
Para instalar o Traefik no Docker Swarm, siga as instruções abaixo:
No servidor manager, crie um arquivo traefik.yaml:
nano traefik.yaml
Adicione o seguinte conteúdo ao arquivo:
version: "3.7"

services:
  traefik:
    image: traefik:2.11.2
    command:
      - "--api.dashboard=true"
      - "--providers.docker.swarmMode=true"
      - "--providers.docker.endpoint=unix:///var/run/docker.sock"
      - "--providers.docker.exposedbydefault=false"
      - "--providers.docker.network=network_public"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.web.http.redirections.entryPoint.to=websecure"
      - "--entrypoints.web.http.redirections.entryPoint.scheme=https"
      - "--entrypoints.web.http.redirections.entrypoint.permanent=true"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencryptresolver.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencryptresolver.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencryptresolver.acme.email=seu@email.com"
      - "--certificatesresolvers.letsencryptresolver.acme.storage=/etc/traefik/letsencrypt/acme.json"
      - "--log.level=DEBUG"
      - "--log.format=common"
      - "--log.filePath=/var/log/traefik/traefik.log"
      - "--accesslog=true"
      - "--accesslog.filepath=/var/log/traefik/access-log"
    deploy:
      placement:
        constraints:
          - node.role == manager
      restart_policy:
        condition: on-failure
        delay: 5s
      labels:
        - "traefik.enable=true"
        - "traefik.http.middlewares.redirect-https.redirectscheme.scheme=https"
        - "traefik.http.middlewares.redirect-https.redirectscheme.permanent=true"
        - "traefik.http.routers.http-catchall.rule=hostregexp(`{host:.+}`)"
        - "traefik.http.routers.http-catchall.entrypoints=web"
        - "traefik.http.routers.http-catchall.middlewares=redirect-https@docker"
        - "traefik.http.routers.http-catchall.priority=1"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "vol_certificates:/etc/traefik/letsencrypt"
    ports:
      - target: 80
        published: 80
        mode: host
      - target: 443
        published: 443
        mode: host
    networks:
      - network_public

volumes:
  vol_certificates:
    external: true
    name: volume_swarm_certificates

networks:
  network_public:
    external: true
    name: network_public
Execute o comando abaixo para fazer o deploy da stack Traefik:
docker stack deploy --prune --resolve-image always -c traefik.yaml traefik
​
Deploy da Evolution API v2
Finalmente, para implantar a Evolution API v2 no Docker Swarm, use o arquivo de configuração disponível aqui com o seguinte conteúdo:
version: "3.7"

services:
  evolution_v2:
    image: evoapicloud/evolution-api:v2.1.1
    volumes:
      - evolution_instances:/evolution/instances
    networks:
      - network_public
    environment:
      - SERVER_URL=https://evo2.site.com
      - DEL_INSTANCE=false
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://postgres:SENHA@postgres:5432/evolution
      - DATABASE_SAVE_DATA_INSTANCE=true
      - DATABASE_SAVE_DATA_NEW_MESSAGE=true
      - DATABASE_SAVE_MESSAGE_UPDATE=true
      - DATABASE_SAVE_DATA_CONTACTS=true
      - DATABASE_SAVE_DATA_CHATS=true
      - DATABASE_SAVE_DATA_LABELS=true
      - DATABASE_SAVE_DATA_HISTORIC=true
      - DATABASE_CONNECTION_CLIENT_NAME=evolution_v2
      - RABBITMQ_ENABLED=false
      - RABBITMQ_URI=amqp://admin:admin@rabbitmq:5672/default
      - CACHE_REDIS_ENABLED=true
      - CACHE_REDIS_URI=redis://evo_redis:6379/1
      - CACHE_REDIS_PREFIX_KEY=evolution_v2
      - CACHE_REDIS_SAVE_INSTANCES=false
      - CACHE_LOCAL_ENABLED=false
      - S3_ENABLED=true
      - S3_ACCESS_KEY=
      - S3_SECRET_KEY=
      - S3_BUCKET=evolution
      - S3_PORT=443
      - S3_ENDPOINT=files.site.com
      - S3_USE_SSL=true
      - AUTHENTICATION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
    deploy:
      mode: replicated
      replicas: 1
      placement:
        constraints:
          - node.hostname == evolution-manager
      labels:
        - traefik.enable=true
        - traefik.http.routers.evolution_v2.rule=Host(`evo2.site.com`)
        - traefik.http.routers.evolution_v2.entrypoints=websecure
        - traefik.http.routers.evolution_v2.tls.certresolver=letsencryptresolver
        - traefik.http.routers.evolution_v2.service=evolution_v2
        - traefik.http.services.evolution_v2.loadbalancer.server.port=8080
        - traefik.http.services.evolution_v2.loadbalancer.passHostHeader=true

volumes:
  evolution_instances:
    external: true
    name: evolution_v2_data

networks:
  network_public:
    external: true
    name: network_public
Após configurar e salvar o arquivo, faça o deploy da stack com o comando:
docker stack deploy --prune --resolve-image always -c evolution_api_v2.yaml evolution_v2
​
Acessando a API
Abra seu navegador e acesse https://evo2.site.com para verificar se a Evolution API está operacional.

Variáveis de Ambiente
Veja o arquivo de exemplo do env no repositório oficial.
​
Server
Variável	Valor	Exemplo
SERVER_TYPE	O tipo de servidor (http ou https)	http
SERVER_PORT	Porta em que o servidor será executado	8080
SERVER_URL	O endereço para seu servidor em execução. Esse endereço é utilizado para retornar dados de requisição interna, como links de webhook.	https://exemplo.evolution-api.com
​
Telemetria
Variável	Valor	Exemplo
TELEMETRY	Habilita ou desabilita a telemetria (true ou false)	true
TELEMETRY_URL	URL do servidor de telemetria	https://telemetry.example.com
​
CORS
Variável	Valor	Exemplo
CORS_ORIGIN	As origens permitidas pela API separadas por vírgula (utilize ”*” para aceitar requisições de qualquer origem)	*
CORS_METHODS	Métodos HTTP permitidos separados por vírgula	GET,POST,PUT,DELETE
CORS_CREDENTIALS	Permissão de cookies em requisições (true ou false)	true
​
Logs
Variável	Valor	Exemplo
LOG_LEVEL	Logs que serão mostrados entre: ERROR, WARN, DEBUG, INFO, LOG, VERBOSE, DARK, WEBHOOKS	ERROR,WARN,DEBUG,INFO,LOG,VERBOSE,DARK,WEBHOOKS
LOG_COLOR	Mostrar ou não cores nos Logs (true ou false)	true
LOG_BAILEYS	Quais logs da Baileys serão mostrados entre: “fatal”, “error”, “warn”, “info”, “debug”, “trace”	error
​
Instâncias
Variável	Valor	Exemplo
DEL_INSTANCE	Em quantos minutos uma instância será excluída se não conectada. Use “false” para nunca excluir	false
​
Armazenamento Persistente
Variável	Valor	Exemplo
DATABASE_ENABLED	Se o armazenamento persistente está habilitado (true ou false)	true
DATABASE_PROVIDER	Provedor de banco de dados (postgresql ou mysql)	postgresql
DATABASE_CONNECTION_URI	A URI de conexão do banco de dados	postgresql://user:pass@localhost:5432/evolution?schema=public
DATABASE_CONNECTION_CLIENT_NAME	Nome do cliente para a conexão com o banco de dados, usado para separar uma instalação da API de outra que usa o mesmo banco	evolution_exchange
​
Quais dados serão salvos (true ou false)
Variável	Valor
DATABASE_SAVE_DATA_INSTANCE	Salva dados de instâncias
DATABASE_SAVE_DATA_NEW_MESSAGE	Salva novas mensagens
DATABASE_SAVE_MESSAGE_UPDATE	Salva atualizações de mensagens
DATABASE_SAVE_DATA_CONTACTS	Salva contatos
DATABASE_SAVE_DATA_CHATS	Salva conversas
DATABASE_SAVE_DATA_LABELS	Salva etiquetas
DATABASE_SAVE_DATA_HISTORIC	Salva histórico de eventos
​
RabbitMQ
Variável	Valor	Exemplo
RABBITMQ_ENABLED	Habilita o RabbitMQ (true ou false)	false
RABBITMQ_URI	URI de conexão do RabbitMQ	amqp://localhost
RABBITMQ_EXCHANGE_NAME	Nome do exchange	evolution
RABBITMQ_GLOBAL_ENABLED	Habilita o RabbitMQ de forma global (true ou false)	false
​
Escolha os eventos que deseja enviar para o RabbitMQ
Variável	Valor	Exemplo
RABBITMQ_EVENTS_APPLICATION_STARTUP	Envia um evento na inicialização do app (true ou false)	false
RABBITMQ_EVENTS_INSTANCE_CREATE	Envia eventos de criação de instância (true ou false)	false
RABBITMQ_EVENTS_INSTANCE_DELETE	Envia eventos de deleção de instância (true ou false)	false
RABBITMQ_EVENTS_QRCODE_UPDATED	Envia eventos de atualização do QR Code (true ou false)	false
RABBITMQ_EVENTS_MESSAGES_SET	Envia eventos de criação de mensagens (recuperação de mensagens) (true ou false)	false
RABBITMQ_EVENTS_MESSAGES_UPSERT	Envia eventos de recebimento de mensagens (true ou false)	false
RABBITMQ_EVENTS_MESSAGES_EDITED	Envia eventos de edição de mensagens (true ou false)	false
RABBITMQ_EVENTS_MESSAGES_UPDATE	Envia eventos de atualização de mensagens (true ou false)	false
RABBITMQ_EVENTS_MESSAGES_DELETE	Envia eventos de deleção de mensagens (true ou false)	false
RABBITMQ_EVENTS_SEND_MESSAGE	Envia eventos de envio de mensagens (true ou false)	false
RABBITMQ_EVENTS_CONTACTS_SET	Envia eventos de criação de contatos (true ou false)	false
RABBITMQ_EVENTS_CONTACTS_UPSERT	Envia eventos de recuperação de contatos (true ou false)	false
RABBITMQ_EVENTS_CONTACTS_UPDATE	Envia eventos de atualização de contatos (true ou false)	false
RABBITMQ_EVENTS_PRESENCE_UPDATE	Envia eventos de atualização de presença (“digitando…” ou “gravando…”) (true ou false)	false
RABBITMQ_EVENTS_CHATS_SET	Envia eventos de criação de conversas (recuperação de conversas) (true ou false)	false
RABBITMQ_EVENTS_CHATS_UPSERT	Envia eventos de criação de conversas (recebimento ou envio de mensagens em novos chats) (true ou false)	false
RABBITMQ_EVENTS_CHATS_UPDATE	Envia eventos de atualização de conversas (true ou false)	false
RABBITMQ_EVENTS_CHATS_DELETE	Envia eventos de deleção de conversas (true ou false)	false
RABBITMQ_EVENTS_GROUPS_UPSERT	Envia eventos de criação de grupos (true ou false)	false
RABBITMQ_EVENTS_GROUP_UPDATE	Envia eventos de atualização de grupos (true ou false)	false
RABBITMQ_EVENTS_GROUP_PARTICIPANTS_UPDATE	Envia eventos de atualização nos participantes de grupos (true ou false)	false
RABBITMQ_EVENTS_CONNECTION_UPDATE	Envia eventos de atualização de conexão (true ou false)	false
RABBITMQ_EVENTS_CALL	Envia eventos de chamadas (true ou false)	false
RABBITMQ_EVENTS_TYPEBOT_START	Envia eventos de início de fluxo do Typebot (true ou false)	false
RABBITMQ_EVENTS_TYPEBOT_CHANGE_STATUS	Envia eventos de atualização no status do Typebot (true ou false)	false
​
SQS
Variável	Valor	Exemplo
SQS_ENABLED	Se o SQS está habilitado (true ou false)	false
SQS_ACCESS_KEY_ID	O ID de chave do SQS	-
SQS_SECRET_ACCESS_KEY	Chave de acesso	-
SQS_ACCOUNT_ID	ID da conta	-
SQS_REGION	Região do SQS	-
​
WebSocket
Variável	Valor	Exemplo
WEBSOCKET_ENABLED	Habilita o WebSocket (true ou false)	false
WEBSOCKET_GLOBAL_EVENTS	Habilita eventos globais no WebSocket (true ou false)	false
​
WhatsApp Business API
Variável	Valor	Exemplo
WA_BUSINESS_TOKEN_WEBHOOK	Token usado para validar o webhook no Facebook APP	evolution
WA_BUSINESS_URL	URL da API do WhatsApp Business	https://graph.facebook.com
WA_BUSINESS_VERSION	Versão da API do WhatsApp Business	v20.0
WA_BUSINESS_LANGUAGE	Idioma da API do WhatsApp Business	en_US
​
Webhook Global
Variável	Valor	Exemplo
WEBHOOK_GLOBAL_ENABLED	Se os webhooks estão habilitados globalmente (true ou false)	false
WEBHOOK_GLOBAL_URL	URL que receberá as requisições de webhook	https://webhook.example.com
WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS	Ativa webhook por evento, respeitando a URL global e o nome de cada evento (true ou false)	false
​
Eventos de webhook com valor true ou false
Variável
WEBHOOK_EVENTS_APPLICATION_STARTUP
WEBHOOK_EVENTS_QRCODE_UPDATED
WEBHOOK_EVENTS_MESSAGES_SET
WEBHOOK_EVENTS_MESSAGES_UPSERT
WEBHOOK_EVENTS_MESSAGES_EDITED
WEBHOOK_EVENTS_MESSAGES_UPDATE
WEBHOOK_EVENTS_MESSAGES_DELETE
WEBHOOK_EVENTS_SEND_MESSAGE
WEBHOOK_EVENTS_CONTACTS_SET
WEBHOOK_EVENTS_CONTACTS_UPSERT
WEBHOOK_EVENTS_CONTACTS_UPDATE
WEBHOOK_EVENTS_PRESENCE_UPDATE
WEBHOOK_EVENTS_CHATS_SET
WEBHOOK_EVENTS_CHATS_UPSERT
WEBHOOK_EVENTS_CHATS_UPDATE
WEBHOOK_EVENTS_CHATS_DELETE
WEBHOOK_EVENTS_GROUPS_UPSERT
WEBHOOK_EVENTS_GROUPS_UPDATE
WEBHOOK_EVENTS_GROUP_PARTICIPANTS_UPDATE
WEBHOOK_EVENTS_CONNECTION_UPDATE
WEBHOOK_EVENTS_LABELS_EDIT
WEBHOOK_EVENTS_LABELS_ASSOCIATION
WEBHOOK_EVENTS_CALL
WEBHOOK_EVENTS_TYPEBOT_START
WEBHOOK_EVENTS_TYPEBOT_CHANGE_STATUS
WEBHOOK_EVENTS_ERRORS
WEBHOOK_EVENTS_ERRORS_WEBHOOK
​
Configurações de Sessão
Variável	Valor	Exemplo
CONFIG_SESSION_PHONE_CLIENT	Nome que será exibido na conexão do smartphone	Evolution API
CONFIG_SESSION_PHONE_NAME	Nome do navegador (Chrome, Firefox, Edge, Opera, Safari)	Chrome
​
QR Code
Variável	Valor	Exemplo
QRCODE_LIMIT	Por quanto tempo o QR code durará	30
QRCODE_COLOR	Cor do QR code gerado	#175197
​
Typebot
Variável	Valor	Exemplo
TYPEBOT_API_VERSION	Versão da API (versão fixa ou latest)	latest
​
Chatwoot
Variável	Valor	Exemplo
CHATWOOT_ENABLED	Habilita a integração com Chatwoot (true ou false)	false
CHATWOOT_MESSAGE_READ	Marca como lida a última mensagem do cliente no WhatsApp ao enviar uma mensagem no Chatwoot (true ou false)	true
CHATWOOT_MESSAGE_DELETE	Deleta a mensagem no Chatwoot quando deletada no WhatsApp (true ou false)	true
CHATWOOT_IMPORT_DATABASE_CONNECTION_URI	URI de conexão com o banco de dados do Chatwoot para importar mensagens	postgresql://user:password@host:5432/chatwoot?sslmode=disable
CHATWOOT_IMPORT_PLACEHOLDER_MEDIA_MESSAGE	Importa as mensagens de mídia como placeholder no Chatwoot (true ou false)	true
​
OpenAI
Variável	Valor	Exemplo
OPENAI_ENABLED	Habilita a integração com OpenAI (true ou false)	false
​
Dify
Variável	Valor	Exemplo
DIFY_ENABLED	Habilita a integração com Dify (true ou false)	false
​
Cache
Variável	Valor	Exemplo
CACHE_REDIS_ENABLED	Habilita o cache Redis (true ou false)	true
CACHE_REDIS_URI	A URI de conexão do Redis	redis://localhost:6379/6
CACHE_REDIS_PREFIX_KEY	Prefixo para diferenciar dados de uma instalação para outra usando o mesmo Redis	evolution
CACHE_REDIS_SAVE_INSTANCES	Salva as credenciais de conexão do WhatsApp no Redis (true ou false)	false
CACHE_LOCAL_ENABLED	Habilita o cache local em memória como alternativa ao Redis (true ou false)	false
​
Amazon S3 / MinIO
Variável	Valor	Exemplo
S3_ENABLED	Habilita o armazenamento no S3 (true ou false)	false
S3_ACCESS_KEY	Chave de acesso do S3	-
S3_SECRET_KEY	Chave secreta do S3	-
S3_BUCKET	Nome do bucket no S3	evolution
S3_PORT	Porta de conexão ao S3	443
S3_ENDPOINT	Endpoint do S3 (ou MinIO)	s3.amazonaws.com
S3_USE_SSL	Usa SSL para conexão ao S3 (true ou false)	true
​
Autenticação
Variável	Valor	Exemplo
AUTHENTICATION_API_KEY	Chave da API usada para autenticação global	429683C4C977415CAAFCCE10F7D57E11
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES	Exibe as instâncias no endpoint de fetch (true ou false)	true
​
Idioma
Variável	Valor	Exemplo
LANGUAGE	Idioma da API	en


Webhooks
Os Webhooks permitem integração em tempo real entre a Evolution API e o WhatsApp™, permitindo sincronização e compartilhamento automatizados de dados.
É exatamente esse recurso que possibilita a criação de bots de autoatendimento e sistemas multi-serviço.
​
Ativando Webhooks
Existem duas maneiras de ativar o webhook:
No arquivo .env com eventos globais
Chamando o endpoint /webhook/instance
​
Eventos de webhook da instância
A maioria dos usuários preferirá a ativação por instância, desta forma é mais fácil controlar os eventos recebidos, no entanto em alguns casos é necessário um webhook global, isso pode ser feito usando a variável de webhook global.
Aqui está um exemplo com alguns eventos comuns ouvidos:
/webhook/instance
{
  "url": "{{webhookUrl}}",
  "webhook_by_events": false,
  "webhook_base64": false,
  "events": [
      "QRCODE_UPDATED",
      "MESSAGES_UPSERT",
      "MESSAGES_UPDATE",
      "MESSAGES_DELETE",
      "SEND_MESSAGE",
      "CONNECTION_UPDATE",
      "TYPEBOT_START",
      "TYPEBOT_CHANGE_STATUS"
  ]
}
​
Parâmetros
Parâmetro	Tipo	Obrigatório	Descrição
enabled	boolean	Sim	Insira “true” para criar ou alterar dados do Webhook, ou “false” se quiser parar de usá-lo.
url	string	Sim	URL do Webhook para receber dados do evento.
webhook_by_events	boolean	Não	Deseja gerar uma URL específica do Webhook para cada um dos seus eventos.
events	array	Não	Lista de eventos a serem processados. Se você não quiser usar alguns desses eventos, apenas remova-os da lista.
É extremamente necessário que o payload obedeça às regras para criar um arquivo JSON, considerando o arranjo correto de itens, formatação, colchetes, chaves e vírgulas, etc. Antes de consumir o endpoint, se tiver dúvidas sobre a formatação JSON, vá para https://jsonlint.com/ e valide.
​
Eventos Globais de Webhook
Cada URL e eventos de Webhook da instância serão solicitados no momento em que forem criados Defina um webhook global que ouvirá eventos habilitados de todas as instâncias
.env
WEBHOOK_GLOBAL_URL=''
WEBHOOK_GLOBAL_ENABLED=false

# Com esta opção ativada, você trabalha com uma URL por evento de webhook, respeitando a URL global e o nome de cada evento
WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=false

## Defina os eventos que você deseja ouvir, todos os eventos listados abaixo são suportados
WEBHOOK_EVENTS_APPLICATION_STARTUP=false
WEBHOOK_EVENTS_QRCODE_UPDATED=true

# Alguns eventos extras para erros
WEBHOOK_EVENTS_ERRORS=false
WEBHOOK_EVENTS_ERRORS_WEBHOOK=
​
Eventos Suportados
Estes são os eventos de webhook disponíveis e suportados:
Variável de ambiente	URL	Descrição
APPLICATION_STARTUP	/application-startup	Notifica quando uma inicialização de aplicativo ocorre
QRCODE_UPDATED	/qrcode-updated	Envia o base64 do qrcode para leitura
CONNECTION_UPDATE	/connection-update	Informa o status da conexão com o WhatsApp
MESSAGES_SET	/messages-set	Envia uma lista de todas as suas mensagens carregadas no WhatsApp. Este evento ocorre apenas uma vez
MESSAGES_UPSERT	/messages-upsert	Notifica quando uma mensagem é recebida
MESSAGES_UPDATE	/messages-update	Informa quando uma mensagem é atualizada
MESSAGES_DELETE	/messages-delete	Informa quando uma mensagem é excluída
SEND_MESSAGE	/send-message	Notifica quando uma mensagem é enviada
CONTACTS_SET	/contacts-set	Realiza o carregamento inicial de todos os contatos. Este evento ocorre apenas uma vez
CONTACTS_UPSERT	/contacts-upsert	Recarrega todos os contatos com informações adicionais. Este evento ocorre apenas uma vez
CONTACTS_UPDATE	/contacts-update	Informa quando o contato é atualizado
PRESENCE_UPDATE	/presence-update	Informa se o usuário está online, se ele está realizando alguma ação como escrever ou gravar e seu último visto: ‘indisponível’, ‘disponível’, ‘compondo’, ‘gravando’, ‘pausado’
CHATS_SET	/chats-set	Envia uma lista de todos os chats carregados
CHATS_UPDATE	/chats-update	Informa quando o chat é atualizado
CHATS_UPSERT	/chats-upsert	Envia qualquer nova informação de chat
CHATS_DELETE	/chats-delete	Notifica quando um chat é excluído
GROUPS_UPSERT	/groups-upsert	Notifica quando um grupo é criado
GROUPS_UPDATE	/groups-update	Notifica quando um grupo tem suas informações atualizadas
GROUP_PARTICIPANTS_UPDATE	/group-participants-update	Notifica quando uma ação ocorre envolvendo um participante: ‘adicionar’, ‘remover’, ‘promover’, ‘rebaixar’
NEW_TOKEN	/new-jwt	Notifica quando o token (jwt) é atualizado
​
Webhook por eventos
Ao habilitar as opções WEBHOOK_BY_EVENTS nos webhooks globais e locais, os seguintes caminhos serão adicionados ao final do webhook.
Adicione ao final da URL o nome do evento com um traço (-) entre as palavras que compõem o evento.
​
Exemplo
Supondo que sua URL de webhook fosse https://sub.domain.com/webhook/. A Evolution adicionará automaticamente ao final da URL o nome do evento quando webhook_by_events estiver definido como verdadeiro.
Evento	Nova URL de Webhook por Eventos
APPLICATION_STARTUP	https://sub.domain.com/webhook/application-startup
QRCODE_UPDATED	https://sub.domain.com/webhook/qrcode-updated
CONNECTION_UPDATE	https://sub.domain.com/webhook/connection-update
MESSAGES_SET	https://sub.domain.com/webhook/messages-set
MESSAGES_UPSERT	https://sub.domain.com/webhook/messages-upsert
MESSAGES_UPDATE	https://sub.domain.com/webhook/messages-update
MESSAGES_DELETE	https://sub.domain.com/webhook/messages-delete
SEND_MESSAGE	https://sub.domain.com/webhook/send-message
CONTACTS_SET	https://sub.domain.com/webhook/contacts-set
CONTACTS_UPSERT	https://sub.domain.com/webhook/contacts-upsert
CONTACTS_UPDATE	https://sub.domain.com/webhook/contacts-update
PRESENCE_UPDATE	https://sub.domain.com/webhook/presence-update
CHATS_SET	https://sub.domain.com/webhook/chats-set
CHATS_UPDATE	https://sub.domain.com/webhook/chats-update
CHATS_UPSERT	https://sub.domain.com/webhook/chats-upsert
CHATS_DELETE	https://sub.domain.com/webhook/chats-delete
GROUPS_UPSERT	https://sub.domain.com/webhook/groups-upsert
GROUPS_UPDATE	https://sub.domain.com/webhook/groups-update
GROUP_PARTICIPANTS_UPDATE	https://sub.domain.com/webhook/group-participants-update
NEW_TOKEN	https://sub.domain.com/webhook/new-jwt
​
Localizando Webhook
Se necessário, há uma opção para localizar qualquer webhook ativo na instância específica.
Método	Endpoint
GET	[baseUrl]/webhook/find/[instance]
​
Dados retornados da solicitação:
Chamando o endpoint retornará todas as informações sobre o webhook que está sendo usado pela instância.
Resultado
{
  "enabled": true,
  "url": "[url]",
  "webhookByEvents": false,
  "events": [
    [eventos]
  ]
}

Recursos Disponíveis
​
Recursos de Mensagens e Grupos
​
Mensagens (Individuais ou em Grupo)
Recurso	Disponibilidade	Descrição
Envio de Texto	✅	(Texto simples, em negrito, itálico, riscado, em formato de código e emojis)
Envio de Mídia	✅	(Vídeo, imagem e documento)
Envio de Áudio Narrado	✅	(Funcionando bem no Android e iOS)
Envio de Localização	✅	(Com nome e descrição do local)
Envio de Contato	✅	(Com Nome, Empresa, Telefone, E-mail e URL)
Envio de Reação	✅	(Envie qualquer emoji para reação)
Envio de Pré-visualização de Link	✅	(Busca por informações de SEO) 🆕
Envio de Resposta	✅	(Marcar mensagens em resposta) 🆕
Envio de Menção	✅	(Individual, para alguns ou todos os membros) 🆕
Envio de Enquete	✅	(Enviar e receber votos de uma enquete) 🆕
Envio de Status/História	✅	(Texto, pré-visualização de link, vídeo, imagem e forma de onda) 🆕
Envio de Adesivo	✅	(Imagem estática) 🆕
Envio de Lista (Homologação)	✅	(Testando)
Envio de Botões (Descontinuado)	❌	(Só funciona na API em nuvem)
​
Perfil
Recurso	Disponibilidade	Descrição
Atualizar Nome	✅	(Alterar o nome do perfil conectado)
Atualizar Foto	✅	(Alterar a foto do perfil conectado) 🆕
Atualizar Status	✅	(Alterar o status do perfil conectado) 🆕
E muitos outros…		
​
Grupo
Recurso	Disponibilidade	Descrição
Criar Grupo	✅	(Novos grupos)
Atualizar Foto	✅	(Alterar foto do grupo)
Atualizar Assunto	✅	(Alterar o nome do grupo) 🆕
Atualizar Descrição	✅	(Alterar a descrição do grupo) 🆕
Obter Todos os Grupos	✅	(Obter todos os grupos e participantes) 🆕
E muitos outros…		

WebSocket
A Evolution API utiliza o socket.io para emitir eventos em tempo real, aproveitando a tecnologia WebSocket. Isso torna o desenvolvimento de integrações mais eficiente e direto para os desenvolvedores. O WebSocket fornece um canal de comunicação full-duplex sobre uma única conexão duradoura, permitindo o fluxo de dados em tempo real entre o cliente e o servidor.
Para ativar os WebSockets, defina a variável de ambiente WEBSOCKET_ENABLED como true. Veja mais detalhes em Variáveis de Ambiente.
​
Modos de Operação do WebSocket
​
Modo Global
No modo global, a variável de ambiente WEBSOCKET_GLOBAL_EVENTS deve ser definida como true. Nesse modo, o WebSocket é inicializado no start do serviço e envia eventos de todas as instâncias, independentemente dos canais. Isso significa que qualquer cliente conectado ao WebSocket receberá eventos globais, abrangendo todas as instâncias da Evolution API configuradas no sistema.
Ativação: Configure no arquivo .env:
WEBSOCKET_GLOBAL_EVENTS=true
Funcionamento: Ideal para cenários onde você deseja monitorar ou processar eventos de todas as instâncias simultaneamente, sem precisar estabelecer uma conexão separada para cada instância.
Conexão: No modo global, a conexão ao WebSocket não requer o uso do /nome_instancia na URL. A URL de conexão será simplesmente:
wss://api.seusite.com
​
Modo Tradicional
No modo tradicional, o WebSocket só pode ser conectado após a execução do comando set na instância. Isso permite que o WebSocket seja específico para cada instância, e a comunicação em tempo real é restrita àquela instância.
Ativação: Certifique-se de que WEBSOCKET_GLOBAL_EVENTS esteja definido como false ou não esteja configurado, e siga o fluxo tradicional de configuração da instância.
Funcionamento: Ideal para cenários onde você deseja uma comunicação em tempo real mais isolada, focada em uma única instância, permitindo maior controle e segmentação dos eventos.
Conexão: No modo tradicional, a conexão ao WebSocket requer o uso do /nome_instancia na URL:
wss://api.seusite.com/nome_instancia
​
Conexão ao WebSocket
​
Modo Global
No modo global, a URL de conexão é mais simples e não requer o nome da instância:
wss://api.seusite.com
​
Modo Tradicional
No modo tradicional, utilize o seguinte formato de URL:
wss://api.seusite.com/nome_instancia
Substitua api.seusite.com pelo domínio real da sua API e nome_instancia pelo nome da sua instância específica.
​
Exemplo de Estabelecimento de Conexão WebSocket
Aqui está um exemplo básico de como estabelecer uma conexão WebSocket usando JavaScript:
const socket = io('wss://api.seusite.com/nome_instancia', {
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('Conectado ao WebSocket da Evolution API');
});

// Escutando eventos
socket.on('nome_evento', (data) => {
  console.log('Evento recebido:', data);
});

// Lidando com desconexão
socket.on('disconnect', () => {
  console.log('Desconectado do WebSocket da Evolution API');
});
Neste exemplo, substitua nome_evento pelo evento específico que você deseja escutar.
​
Manipulação de Eventos
Uma vez conectado, você pode escutar vários eventos emitidos pelo servidor. Cada evento pode carregar dados relevantes para o contexto do evento. Por exemplo, se estiver ouvindo atualizações de mensagens, você pode receber dados contendo o conteúdo da mensagem atualizada e metadados.
​
Fechamento da Conexão
Para fechar a conexão WebSocket, utilize o método disconnect:
socket.disconnect();
Lembre-se de manipular a conexão de forma responsável, desconectando quando sua aplicação ou componente for desmontado para evitar vazamentos de memória e garantir o uso eficiente de recursos.
​
Considerações Finais
A Evolution API oferece uma forma poderosa de interação em tempo real através dos WebSockets, proporcionando uma experiência contínua tanto para desenvolvedores quanto para usuários finais. Seja no modo global, monitorando todas as instâncias simultaneamente, ou no modo tradicional, focado em uma única instância, a flexibilidade do sistema permite a adaptação às necessidades específicas do seu projeto.

RabbitMQ
A Evolution API permite a integração com o RabbitMQ para gerenciar eventos e filas de mensagens, facilitando a comunicação e processamento de tarefas de forma eficiente e escalável. A seguir, você encontrará informações sobre como configurar o RabbitMQ tanto em modo global quanto em instâncias individuais.
​
Configuração Global do RabbitMQ
Com a nova configuração global, é possível centralizar o processamento de eventos em filas unificadas, em vez de configurar filas separadas para cada instância. Isso simplifica a gestão de eventos, pois todos os eventos do sistema passam por filas específicas de acordo com o tipo de evento.
​
Configuração de Variáveis de Ambiente
Aqui estão as variáveis de ambiente necessárias para habilitar e configurar o RabbitMQ em modo global:
RABBITMQ_ENABLED=true
RABBITMQ_URI=amqp://admin:admin@localhost:5672/default
RABBITMQ_EXCHANGE_NAME=evolution_exchange
RABBITMQ_GLOBAL_ENABLED=true
​
Eventos Configuráveis
Com o modo global habilitado (RABBITMQ_GLOBAL_ENABLED=true), todos os eventos são enfileirados em filas específicas por tipo de evento, em vez de por instância. Aqui está a lista de eventos que você pode ativar globalmente:
RABBITMQ_EVENTS_APPLICATION_STARTUP=true
RABBITMQ_EVENTS_INSTANCE_CREATE=true
RABBITMQ_EVENTS_INSTANCE_DELETE=true
RABBITMQ_EVENTS_QRCODE_UPDATED=true
RABBITMQ_EVENTS_MESSAGES_SET=true
RABBITMQ_EVENTS_MESSAGES_UPSERT=true
RABBITMQ_EVENTS_MESSAGES_EDITED=true
RABBITMQ_EVENTS_MESSAGES_UPDATE=true
RABBITMQ_EVENTS_MESSAGES_DELETE=true
RABBITMQ_EVENTS_SEND_MESSAGE=true
RABBITMQ_EVENTS_CONTACTS_SET=true
RABBITMQ_EVENTS_CONTACTS_UPSERT=true
RABBITMQ_EVENTS_CONTACTS_UPDATE=true
RABBITMQ_EVENTS_PRESENCE_UPDATE=true
RABBITMQ_EVENTS_CHATS_SET=true
RABBITMQ_EVENTS_CHATS_UPSERT=true
RABBITMQ_EVENTS_CHATS_UPDATE=true
RABBITMQ_EVENTS_CHATS_DELETE=true
RABBITMQ_EVENTS_GROUPS_UPSERT=true
RABBITMQ_EVENTS_GROUP_UPDATE=true
RABBITMQ_EVENTS_GROUP_PARTICIPANTS_UPDATE=true
RABBITMQ_EVENTS_CONNECTION_UPDATE=true
RABBITMQ_EVENTS_CALL=true
RABBITMQ_EVENTS_TYPEBOT_START=true
RABBITMQ_EVENTS_TYPEBOT_CHANGE_STATUS=true
​
Funcionamento
Fila por Evento: No modo global, os eventos são enfileirados em filas específicas para cada tipo de evento. Por exemplo, todos os eventos de atualização de mensagens (MESSAGES_UPDATE) serão enfileirados na mesma fila, independentemente da instância de origem.
Facilidade de Gerenciamento: Essa abordagem facilita o gerenciamento e monitoramento dos eventos, permitindo uma centralização das operações e simplificando a lógica de consumo de mensagens no seu sistema.
​
Configuração do RabbitMQ para Instâncias Individuais
Embora a configuração global seja recomendada para centralizar o processamento de eventos, ainda é possível configurar o RabbitMQ para instâncias individuais, caso haja necessidade de segmentação por instância.
​
Endpoint para Configuração Individual
Para configurar o RabbitMQ para uma instância específica do WhatsApp na Evolution API, utilize o seguinte endpoint:
POST [baseUrl]/rabbitmq/set/[instance_name]
​
Corpo da Requisição
Aqui está um exemplo do corpo JSON para configurar eventos em uma instância específica:
{
    "enabled": true,
    "events": [
        "APPLICATION_STARTUP",
        "QRCODE_UPDATED",
        "MESSAGES_SET",
        "MESSAGES_UPSERT",
        "MESSAGES_UPDATE",
        "MESSAGES_DELETE",
        "SEND_MESSAGE",
        "CONTACTS_SET",
        "CONTACTS_UPSERT",
        "CONTACTS_UPDATE",
        "PRESENCE_UPDATE",
        "CHATS_SET",
        "CHATS_UPSERT",
        "CHATS_UPDATE",
        "CHATS_DELETE",
        "GROUPS_UPSERT",
        "GROUP_UPDATE",
        "GROUP_PARTICIPANTS_UPDATE",
        "CONNECTION_UPDATE",
        "CALL",
        "NEW_JWT_TOKEN"
    ]
}
Remova eventos não utilizados para otimizar o uso de recursos do RabbitMQ.
Ao configurar a integração com o RabbitMQ para instâncias individuais, ajuste o array de eventos no corpo JSON para incluir apenas os eventos relevantes para aquela instância.
​
Considerações Finais
A configuração do RabbitMQ na Evolution API oferece flexibilidade para gerenciar eventos de forma centralizada com a configuração global, ou de forma segmentada por instância, dependendo das necessidades do seu sistema. Utilize a configuração global para simplificar a gestão de eventos em ambientes complexos, ou configure individualmente para controle mais granular.
Para mais detalhes sobre as variáveis de ambiente do RabbitMQ e outras configurações avançadas, consulte a seção de variáveis de ambiente.

Amazon SQS
A Evolution API permite a integração com o Amazon SQS (Simple Queue Service) para gerenciar eventos e filas de mensagens de forma escalável e confiável. Assim como no RabbitMQ, o SQS na Evolution API pode ser configurado tanto de maneira global quanto para instâncias individuais.
​
Configuração Global do SQS
Para habilitar o SQS e configurar o processamento de eventos de forma centralizada, utilize as seguintes variáveis de ambiente:
​
Configuração de Variáveis de Ambiente
SQS_ENABLED=true
SQS_ACCESS_KEY_ID=your-access-key-id
SQS_SECRET_ACCESS_KEY=your-secret-access-key
SQS_ACCOUNT_ID=your-account-id
SQS_REGION=your-region
​
Explicação das Variáveis
SQS_ENABLED: Ativa (true) ou desativa (false) a integração com o Amazon SQS.
SQS_ACCESS_KEY_ID: Chave de acesso da AWS para autenticação.
SQS_SECRET_ACCESS_KEY: Chave secreta correspondente à chave de acesso para autenticação.
SQS_ACCOUNT_ID: ID da conta AWS onde o SQS está configurado.
SQS_REGION: Região da AWS onde suas filas SQS estão localizadas (por exemplo, us-east-1).
​
Funcionamento
Fila por Evento: No modo global, todos os eventos são enfileirados em filas específicas para cada tipo de evento. Isso significa que eventos de diferentes instâncias são centralizados em filas unificadas por evento, simplificando o processamento e o monitoramento.
​
Configuração do SQS para Instâncias Individuais
Embora a configuração global seja recomendada para centralizar o processamento de eventos, você pode configurar o SQS para instâncias individuais caso precise segmentar as filas por instância.
​
Endpoint para Configuração Individual
Para configurar o SQS para uma instância específica do WhatsApp na Evolution API, utilize o seguinte endpoint:
POST [baseUrl]/sqs/set/[instance_name]
​
Corpo da Requisição
Aqui está um exemplo do corpo JSON para configurar eventos em uma instância específica:
{
    "enabled": true,
    "events": [
        "APPLICATION_STARTUP",
        "QRCODE_UPDATED",
        "MESSAGES_SET",
        "MESSAGES_UPSERT",
        "MESSAGES_UPDATE",
        "MESSAGES_DELETE",
        "SEND_MESSAGE",
        "CONTACTS_SET",
        "CONTACTS_UPSERT",
        "CONTACTS_UPDATE",
        "PRESENCE_UPDATE",
        "CHATS_SET",
        "CHATS_UPSERT",
        "CHATS_UPDATE",
        "CHATS_DELETE",
        "GROUPS_UPSERT",
        "GROUP_UPDATE",
        "GROUP_PARTICIPANTS_UPDATE",
        "CONNECTION_UPDATE",
        "CALL",
        "NEW_JWT_TOKEN"
    ]
}
Remova eventos não utilizados para otimizar o uso de recursos do SQS.
​
Funcionamento
Segmentação por Instância: Ao configurar o SQS para instâncias individuais, cada instância pode ter suas próprias filas específicas para os eventos configurados. Isso permite maior controle e segmentação dos eventos, caso você precise separar o processamento por instância.
​
Considerações Finais
A integração com o Amazon SQS na Evolution API oferece uma solução poderosa para gerenciar eventos de forma escalável e confiável, tanto de maneira centralizada quanto segmentada por instância. Utilize a configuração global para simplificar o processamento em ambientes complexos, ou configure individualmente para um controle mais granular.

Chatwoot
A Evolution API permite uma integração direta com o Chatwoot, uma plataforma de suporte ao cliente que centraliza comunicações de múltiplos canais. Esta documentação detalha como configurar essa integração tanto durante a criação de uma nova instância quanto em uma instância já existente.
​
Configuração da Integração com Chatwoot
​
1. Configuração na Criação da Instância
Você pode configurar o Chatwoot diretamente ao criar uma nova instância na Evolution API. Use o seguinte corpo de requisição para o endpoint /instance/create:
​
Endpoint
POST {{baseUrl}}/instance/create
​
Corpo da Requisição
{
    "instanceName": "NOME DA INSTANCIA",
    "number": "NUMERO DO WHATSAPP PARA GERAR O PAIRING CODE",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS",
    "chatwootAccountId": "1",
    "chatwootToken": "TOKEN",
    "chatwootUrl": "https://chatwoot.com",
    "chatwootSignMsg": true,
    "chatwootReopenConversation": true,
    "chatwootConversationPending": false,
    "chatwootImportContacts": true,
    "chatwootNameInbox": "evolution",
    "chatwootMergeBrazilContacts": true,
    "chatwootImportMessages": true,
    "chatwootDaysLimitImportMessages": 3,
    "chatwootOrganization": "Evolution Bot",
    "chatwootLogo": "https://evolution-api.com/files/evolution-api-favicon.png"
}
​
2. Configuração para Instâncias Existentes
Se você já tem uma instância criada e deseja configurar ou alterar a integração com o Chatwoot, utilize o endpoint /chatwoot/set/{{instance}} com o seguinte formato de requisição:
​
Endpoint
POST {{baseUrl}}/chatwoot/set/{{instance}}
​
Corpo da Requisição
Aqui está um exemplo de como deve ser o corpo da requisição para configurar a integração:
{
    "enabled": true,
    "accountId": "1",
    "token": "TOKEN",
    "url": "https://chatwoot.com",
    "signMsg": true,
    "reopenConversation": true,
    "conversationPending": false,
    "nameInbox": "evolution",
    "mergeBrazilContacts": true,
    "importContacts": true,
    "importMessages": true,
    "daysLimitImportMessages": 2,
    "signDelimiter": "\n",
    "autoCreate": true,
    "organization": "BOT",
    "logo": "link_da_sua_logo"
}
​
Explicação dos Parâmetros
enabled: Ativa (true) ou desativa (false) a integração do Chatwoot para a instância.
accountId: ID da conta do Chatwoot associada à integração.
token: Token de autenticação do usuário administrador da conta no Chatwoot.
url: URL base do Chatwoot. Importante: Não incluir a / no final da URL.
signMsg: Quando ativado (true), adiciona a assinatura com o nome do atendente nas mensagens enviadas.
reopenConversation: Define se a integração deve sempre reabrir a mesma conversa (true) ou criar uma nova.
conversationPending: Inicia as conversas como pendentes (true), aguardando ação de um atendente.
nameInbox: Nome customizado da inbox no Chatwoot. Se não fornecido, a instância usará o nome da instância.
mergeBrazilContacts: Faz merge de contatos brasileiros que possuem o dígito 9 adicional em seus números (true).
importContacts: Importa os contatos da agenda do WhatsApp para o Chatwoot (true).
importMessages: Importa as mensagens do WhatsApp para o Chatwoot (true).
daysLimitImportMessages: Define o número limite de dias para importação de mensagens antigas do WhatsApp.
signDelimiter: Delimitador usado para separar a assinatura do corpo da mensagem.
autoCreate: Se ativado (true), cria automaticamente a configuração da inbox no Chatwoot.
organization: Nome do contato do bot de comandos, usado para personalizar a interação.
logo: URL da imagem a ser usada como foto de perfil do contato do bot de comandos.
​
Passos para Configurar a Integração
Obtenha as Credenciais e URLs:
Acesse o painel do Chatwoot e obtenha o accountId e o token do usuário administrador.
Verifique a URL base do seu Chatwoot e configure sem a / final.
Crie ou Configure a Instância:
Use o endpoint /instance/create para configurar o Chatwoot durante a criação da instância.
Use o endpoint /chatwoot/set/{{instance}} para configurar o Chatwoot em uma instância já existente.
Verifique a Configuração:
Acesse o Chatwoot para garantir que a inbox foi criada e que as configurações estão corretas.
Teste o envio e recebimento de mensagens para confirmar a integração.
​
Considerações Finais
A integração da Evolution API com o Chatwoot permite centralizar e automatizar a comunicação do WhatsApp diretamente na sua plataforma de atendimento ao cliente. Com opções de personalização, importação de contatos e mensagens, e a possibilidade de reabrir conversas existentes, esta integração oferece flexibilidade para atender às necessidades específicas do seu fluxo de trabalho.

EvoAI
Integração com a plataforma EvoAI para criação e gerenciamento de bots

A Evolution API permite a criação e gerenciamento de bots usando a tecnologia EvoAI, fornecendo automação avançada e interatividade através de diferentes tipos de bots. A EvoAI é nossa própria tecnologia desenvolvida pela equipe da Evolution. Você pode saber mais em evo-ai.co. Abaixo, você encontrará instruções detalhadas sobre como configurar bots, gerenciar sessões e definir configurações padrão.
​
1. Criando Bots no EvoAI
Você pode configurar vários bots no EvoAI usando gatilhos para iniciar interações. A configuração do bot pode ser feita através do endpoint /evoai/create/{{instance}}.
​
Endpoint para Criação de Bot
​
Endpoint
POST {{baseUrl}}/evoai/create/{{instance}}
​
Corpo da Requisição
Aqui está um exemplo de um corpo JSON para configurar um bot no EvoAI:
{
    "enabled": true,
    "agentUrl": "http://evoai.site.com/v1",
    "apiKey": "app-123456",
    // opções
    "triggerType": "keyword", /* all ou keyword */
    "triggerOperator": "equals", /* contains, equals, startsWith, endsWith, regex, none */
    "triggerValue": "test",
    "expire": 0,
    "keywordFinish": "#SAIR",
    "delayMessage": 1000,
    "unknownMessage": "Mensagem não reconhecida",
    "listeningFromMe": false,
    "stopBotFromMe": false,
    "keepOpen": false,
    "debounceTime": 0,
    "ignoreJids": []
}
​
Explicação dos Parâmetros
enabled: Ativa (true) ou desativa (false) o bot.
agentUrl: URL da API EvoAI (sem uma barra / no final).
apiKey: Chave de API fornecida pelo EvoAI.
Opções:
triggerType: Tipo de gatilho para iniciar o bot (all ou keyword).
triggerOperator: Operador usado para avaliar o gatilho (contains, equals, startsWith, endsWith, regex, none).
triggerValue: Valor usado no gatilho (por exemplo, uma palavra-chave ou regex).
expire: Tempo em minutos após o qual o bot expira, reiniciando se a sessão expirou.
keywordFinish: Palavra-chave que encerra a sessão do bot.
delayMessage: Atraso (em milissegundos) para simular digitação antes de enviar uma mensagem.
unknownMessage: Mensagem enviada quando a entrada do usuário não é reconhecida.
listeningFromMe: Define se o bot deve ouvir mensagens enviadas pelo usuário (true ou false).
stopBotFromMe: Define se o bot deve parar quando o usuário enviar uma mensagem (true ou false).
keepOpen: Mantém a sessão aberta, impedindo que o bot reinicie para o mesmo contato.
debounceTime: Tempo (em segundos) para combinar várias mensagens em uma.
ignoreJids: Lista de JIDs de contatos que não ativarão o bot.
​
2. Configurações Padrão do EvoAI
Você pode definir configurações padrão que serão aplicadas se os parâmetros não forem passados durante a criação do bot.
​
Endpoint para Configurações Padrão
​
Endpoint
POST {{baseUrl}}/evoai/settings/{{instance}}
​
Corpo da Requisição
Aqui está um exemplo de configurações padrão:
{
    "expire": 20,
    "keywordFinish": "#SAIR",
    "delayMessage": 1000,
    "unknownMessage": "Mensagem não reconhecida",
    "listeningFromMe": false,
    "stopBotFromMe": false,
    "keepOpen": false,
    "debounceTime": 0,
    "ignoreJids": [],
    "evoaiIdFallback": "clyja4oys0a3uqpy7k3bd7swe"
}
​
Explicação dos Parâmetros
expire: Tempo em minutos após o qual o bot expira.
keywordFinish: Palavra-chave que encerra a sessão do bot.
delayMessage: Atraso para simular digitação antes de enviar uma mensagem.
unknownMessage: Mensagem enviada quando a entrada do usuário não é reconhecida.
listeningFromMe: Define se o bot deve ouvir mensagens enviadas pelo usuário.
stopBotFromMe: Define se o bot deve parar quando o usuário enviar uma mensagem.
keepOpen: Mantém a sessão aberta, impedindo que o bot reinicie para o mesmo contato.
debounceTime: Tempo para combinar várias mensagens em uma.
ignoreJids: Lista de JIDs de contatos que não ativarão o bot.
evoaiIdFallback: ID do bot de fallback que será usado se nenhum gatilho for ativado.
​
3. Gerenciando Sessões do EvoAI
Você pode gerenciar as sessões do bot alterando o status entre aberto, pausado ou fechado para cada contato específico.
​
Endpoint para Gerenciamento de Sessão
​
Endpoint
POST {{baseUrl}}/evoai/changeStatus/{{instance}}
​
Corpo da Requisição
Aqui está um exemplo de como gerenciar o status da sessão:
{
    "remoteJid": "5511912345678@s.whatsapp.net",
    "status": "closed"
}
​
Explicação dos Parâmetros
remoteJid: JID (identificador) do contato no WhatsApp.
status: Status da sessão (opened, paused, closed).
​
4. Variáveis Automáticas no EvoAI
Quando uma sessão do EvoAI é iniciada, algumas variáveis predefinidas são enviadas automaticamente:
inputs: {
    remoteJid: "JID do contato",
    pushName: "Nome do contato",
    instanceName: "Nome da instância",
    serverUrl: "URL do servidor API",
    apiKey: "Chave da API Evolution"
};
​
Explicação das Variáveis Automáticas
remoteJid: JID do contato com o qual o bot está interagindo.
pushName: Nome do contato no WhatsApp.
instanceName: Nome da instância que está executando o bot.
serverUrl: URL do servidor onde a Evolution API está hospedada.
apiKey: Chave de API usada para autenticar solicitações.
​
Considerações Finais
A integração da Evolution API com o EvoAI oferece uma maneira robusta de automatizar interações no WhatsApp. Com a capacidade de configurar gatilhos, gerenciar sessões e usar variáveis automáticas, você pode otimizar o fluxo de trabalho e melhorar a experiência do usuário final.

Evolution Bot
O Evolution Bot é uma integração de chatbot universal que permite a utilização de qualquer URL de API ou automação para criar interações automatizadas. Ao utilizar o Evolution Bot, sua API deve retornar a resposta na forma de um JSON contendo o campo message, que será enviado de volta ao usuário. Este sistema oferece flexibilidade para construir chatbots que se integram perfeitamente com suas APIs personalizadas.
​
1. Criação de Bots no Evolution Bot
Você pode configurar bots no Evolution Bot utilizando triggers para iniciar as interações. A configuração do bot pode ser feita através do endpoint /evolutionBot/create/{{instance}}.
​
Endpoint para Criação de Bots
​
Endpoint
POST {{baseUrl}}/evolutionBot/create/{{instance}}
​
Corpo da Requisição
Aqui está um exemplo de corpo JSON para configurar um bot no Evolution Bot:
{
    "enabled": true,
    "apiUrl": "http://api.site.com/v1",
    "apiKey": "app-123456", // optional
    // opções
    "triggerType": "keyword", /* all ou keyword */
    "triggerOperator": "equals", /* contains, equals, startsWith, endsWith, regex, none */
    "triggerValue": "teste",
    "expire": 0,
    "keywordFinish": "#SAIR",
    "delayMessage": 1000,
    "unknownMessage": "Mensagem não reconhecida",
    "listeningFromMe": false,
    "stopBotFromMe": false,
    "keepOpen": false,
    "debounceTime": 0,
    "ignoreJids": []
}
​
Explicação dos Parâmetros
enabled: Ativa (true) ou desativa (false) o bot.
apiUrl: URL da API que será chamada pelo bot (sem a / no final).
apiKey: Chave da API fornecida pela sua aplicação (opcional).
Opções:
triggerType: Tipo de trigger para iniciar o bot (all ou keyword).
triggerOperator: Operador utilizado para avaliar o trigger (contains, equals, startsWith, endsWith, regex, none).
triggerValue: Valor utilizado no trigger (por exemplo, uma palavra-chave ou regex).
expire: Tempo em minutos após o qual o bot expira, reiniciando se a sessão expirou.
keywordFinish: Palavra-chave que encerra a sessão do bot.
delayMessage: Delay (em milissegundos) para simular a digitação antes de enviar uma mensagem.
unknownMessage: Mensagem enviada quando a entrada do usuário não é reconhecida.
listeningFromMe: Define se o bot deve escutar as mensagens enviadas pelo próprio usuário (true ou false).
stopBotFromMe: Define se o bot deve parar quando o próprio usuário envia uma mensagem (true ou false).
keepOpen: Mantém a sessão aberta, evitando que o bot seja reiniciado para o mesmo contato.
debounceTime: Tempo (em segundos) para juntar várias mensagens em uma só.
ignoreJids: Lista de JIDs de contatos que não ativarão o bot.
​
Exemplo de Retorno da API
A resposta da sua API deve estar no formato JSON e conter a mensagem a ser enviada ao usuário no campo message:
{
    "message": "Sua resposta aqui"
}
​
2. Configurações Padrão do Evolution Bot
Você pode definir configurações padrão que serão aplicadas caso os parâmetros não sejam passados durante a criação do bot.
​
Endpoint para Configurações Padrão
​
Endpoint
POST {{baseUrl}}/evolutionBot/settings/{{instance}}
​
Corpo da Requisição
Aqui está um exemplo de configuração padrão:
{
    "expire": 20,
    "keywordFinish": "#SAIR",
    "delayMessage": 1000,
    "unknownMessage": "Mensagem não reconhecida",
    "listeningFromMe": false,
    "stopBotFromMe": false,
    "keepOpen": false,
    "debounceTime": 0,
    "ignoreJids": [],
    "evolutionBotIdFallback": "clyja4oys0a3uqpy7k3bd7swe"
}
​
Explicação dos Parâmetros
expire: Tempo em minutos após o qual o bot expira.
keywordFinish: Palavra-chave que encerra a sessão do bot.
delayMessage: Delay para simular a digitação antes de enviar uma mensagem.
unknownMessage: Mensagem enviada quando a entrada do usuário não é reconhecida.
listeningFromMe: Define se o bot deve escutar as mensagens enviadas pelo próprio usuário.
stopBotFromMe: Define se o bot deve parar quando o próprio usuário envia uma mensagem.
keepOpen: Mantém a sessão aberta, evitando que o bot seja reiniciado para o mesmo contato.
debounceTime: Tempo para juntar várias mensagens em uma só.
ignoreJids: Lista de JIDs de contatos que não ativarão o bot.
evolutionBotIdFallback: ID do bot de fallback que será utilizado caso nenhum trigger seja ativado.
​
3. Gerenciamento de Sessões do Evolution Bot
Você pode gerenciar as sessões do bot, alterando o status entre aberta, pausada ou fechada para cada contato específico.
​
Endpoint para Gerenciamento de Sessões
​
Endpoint
POST {{baseUrl}}/evolutionBot/changeStatus/{{instance}}
​
Corpo da Requisição
Aqui está um exemplo de como gerenciar o status da sessão:
{
    "remoteJid": "5511912345678@s.whatsapp.net",
    "status": "closed"
}
​
Explicação dos Parâmetros
remoteJid: JID (identificador) do contato no WhatsApp.
status: Status da sessão (opened, paused, closed).
​
4. Variáveis Automáticas e Especiais no Evolution Bot
Quando uma sessão do Evolution Bot é iniciada, algumas variáveis predefinidas são automaticamente enviadas:
inputs: {
    remoteJid: "JID do contato",
    pushName: "Nome do contato",
    instanceName: "Nome da instância",
    serverUrl: "URL do servidor da API",
    apiKey: "Chave de API da Evolution"
};
​
Explicação das Variáveis Automáticas
remoteJid: JID do contato com quem o bot está interagindo.
pushName: Nome do contato no WhatsApp.
instanceName: Nome da instância que está executando o bot.
serverUrl: URL do servidor onde a Evolution API está hospedada.
apiKey: Chave de API usada para autenticar as requisições.
​
Considerações Finais
O Evolution Bot oferece uma plataforma flexível para integração de chatbots com suas APIs personalizadas, permitindo automação avançada e interações personalizadas no WhatsApp. Com o suporte para triggers, gerenciamento de sessões e configuração de variáveis automáticas, você pode construir uma experiência de chatbot robusta e eficaz para seus usuários.

Typebot
A Evolution API permite integrar bots do Typebot para automatizar interações e responder a mensagens do WhatsApp com base em triggers configurados. A seguir, você encontrará as instruções detalhadas sobre como configurar, gerenciar sessões, inicializar bots manualmente e utilizar variáveis predefinidas.
​
1. Configuração de Bots no Typebot
Você pode configurar diversos bots no Typebot utilizando triggers para iniciar as interações. A configuração do bot pode ser feita através do endpoint /typebot/create/{{instance}}.
​
Endpoint para Configuração de Bots
​
Endpoint
POST {{baseUrl}}/typebot/create/{{instance}}
​
Corpo da Requisição
Aqui está um exemplo de corpo JSON para configurar um bot:
{
    "enabled": true,
    "url": "https://bot.dgcode.com.br",
    "typebot": "my-typebot-uoz1rg9",
    "triggerType": "keyword",
    "triggerOperator": "regex",
    "triggerValue": "^atend.*",
    "expire": 20,
    "keywordFinish": "#SAIR",
    "delayMessage": 1000,
    "unknownMessage": "Mensagem não reconhecida",
    "listeningFromMe": false,
    "stopBotFromMe": false,
    "keepOpen": false,
    "debounceTime": 10
}
​
Explicação dos Parâmetros
enabled: Ativa (true) ou desativa (false) o bot.
url: URL da API do Typebot (sem a / no final).
typebot: Nome público do bot no Typebot.
triggerType: Tipo de trigger para iniciar o bot (keyword, all, none).
triggerOperator: Operador utilizado para avaliar o trigger (contains, equals, startsWith, endsWith, regex).
triggerValue: Valor utilizado no trigger (por exemplo, uma palavra-chave ou regex).
expire: Tempo em minutos após o qual o bot expira, reiniciando se a sessão expirou.
keywordFinish: Palavra-chave que, quando recebida, encerra a sessão do bot.
delayMessage: Delay (em milissegundos) para simular a digitação antes de enviar uma mensagem.
unknownMessage: Mensagem enviada quando a entrada do usuário não é reconhecida.
listeningFromMe: Define se o bot deve escutar as mensagens enviadas pelo próprio usuário (true ou false).
stopBotFromMe: Define se o bot deve parar quando o próprio usuário envia uma mensagem (true ou false).
keepOpen: Mantém a sessão aberta, evitando que o bot seja reiniciado para o mesmo contato.
debounceTime: Tempo (em segundos) para juntar várias mensagens em uma só.
​
2. Gerenciamento de Sessões do Typebot
Você pode gerenciar as sessões do Typebot para cada contato específico, alterando o status da sessão entre aberta, pausada ou fechada.
​
Endpoint para Gerenciamento de Sessões
​
Endpoint
POST {{baseUrl}}/typebot/changeStatus/{{instance}}
​
Corpo da Requisição
Aqui está um exemplo de como gerenciar o status da sessão:
{
    "remoteJid": "5511912345678@s.whatsapp.net",
    "status": "closed"
}
​
Explicação dos Parâmetros
remoteJid: JID (identificador) do contato no WhatsApp.
status: Status da sessão (opened, paused, closed).
​
3. Configuração Padrão do Typebot
Você pode definir configurações padrão que serão aplicadas caso os parâmetros não sejam passados durante a criação do bot.
​
Configuração Padrão
Aqui está um exemplo de configuração padrão:
{
    "expire": 20,
    "keywordFinish": "#SAIR",
    "delayMessage": 1000,
    "unknownMessage": "Mensagem não reconhecida",
    "listeningFromMe": false,
    "stopBotFromMe": false,
    "keepOpen": false,
    "debounceTime": 10,
    "ignoreJids": [],
    "typebotIdFallback": "clyja4oys0a3uqpy7k3bd7swe"
}
​
Explicação dos Parâmetros
expire: Tempo em minutos após o qual o bot expira.
keywordFinish: Palavra-chave que encerra a sessão do bot.
delayMessage: Delay para simular a digitação antes de enviar uma mensagem.
unknownMessage: Mensagem enviada quando a entrada do usuário não é reconhecida.
listeningFromMe: Define se o bot deve escutar as mensagens enviadas pelo próprio usuário.
stopBotFromMe: Define se o bot deve parar quando o próprio usuário envia uma mensagem.
keepOpen: Mantém a sessão aberta, evitando que o bot seja reiniciado para o mesmo contato.
debounceTime: Tempo para juntar várias mensagens em uma só.
ignoreJids: Lista de JIDs de contatos que não ativarão o bot.
typebotIdFallback: ID do bot de fallback que será utilizado caso nenhum trigger seja ativado.
​
4. Inicialização Ativa de um Bot
Além de usar triggers, você pode inicializar um bot de forma ativa para um contato específico usando o endpoint /typebot/start/{{instance}}.
​
Endpoint para Inicialização Ativa
​
Endpoint
POST {{baseUrl}}/typebot/start/{{instance}}
​
Corpo da Requisição
Aqui está um exemplo de como iniciar um bot de forma ativa:
{
    "url": "https://bot.dgcode.com.br",
    "typebot": "fluxo-unico-3uuso28",
    "remoteJid": "557499879409@s.whatsapp.net",
    "startSession": false,
    "variables": [
        {
            "name": "pushName",
            "value": "Davidson Gomes"
        }
    ]
}
​
Explicação dos Parâmetros
url: URL da API do Typebot (sem a / no final).
typebot: Nome público do bot no Typebot.
remoteJid: JID (identificador) do contato no WhatsApp.
startSession: Define se a sessão deve ser iniciada com o bot (true ou false).
variables: Variáveis personalizadas que podem ser passadas ao bot (por exemplo, nome do usuário).
​
Variáveis Predefinidas
Quando uma sessão do Typebot é iniciada, algumas variáveis predefinidas são automaticamente enviadas:
const prefilledVariables = {
    remoteJid: "JID do contato",
    pushName: "Nome do contato",
    instanceName: "Nome da instância",
    serverUrl: "URL do servidor da API",
    apiKey: "Chave de API da Evolution",
    ownerJid: "JID do número conectado à instância"
};
​
Explicação das Variáveis Predefinidas
remoteJid: JID do contato com quem o bot está interagindo.
pushName: Nome do contato no WhatsApp.
instanceName: Nome da instância que está executando o bot.
serverUrl: URL do servidor onde a Evolution API está hospedada.
apiKey: Chave de API usada para autenticar as requisições.
ownerJid: JID do número de telefone conectado à instância.
​
Interação com Variáveis Passadas no startTypebot
Quando você utiliza o endpoint startTypebot, as variáveis passadas no corpo da requisição são combinadas com as variáveis predefinidas. Isso permite que você adicione ou sobrescreva informações específicas para personalizar ainda mais a interação do bot.
​
Considerações Finais
A integração da Evolution API com o Typebot oferece uma maneira poderosa e flexível de automatizar interações no WhatsApp. Com variáveis predefinidas e a capacidade de iniciar bots de forma ativa, você pode personalizar a experiência do usuário final e otimizar o fluxo de atendimento.

OpenAI
A Evolution API permite a criação e gerenciamento de bots utilizando a tecnologia OpenAI, permitindo interações automatizadas e personalizadas através de assistentes virtuais ou modelos de chat completions. A seguir, você encontrará instruções detalhadas sobre como configurar credenciais, criar bots, gerenciar sessões e definir configurações padrão, incluindo o uso de reconhecimento de fala (speech-to-text).
​
1. Criação de Credenciais do OpenAI
Antes de criar bots, é necessário configurar as credenciais da API do OpenAI. Isso é feito utilizando o endpoint /openai/creds/{{instance}}.
​
Endpoint para Criação de Credenciais
​
Endpoint
POST {{baseUrl}}/openai/creds/{{instance}}
​
Corpo da Requisição
Aqui está um exemplo de como cadastrar uma nova credencial do OpenAI:
{
    "name": "apikey",
    "apiKey": "sk-proj-..."
}
​
Explicação dos Parâmetros
name: Nome identificador da credencial.
apiKey: Chave da API fornecida pelo OpenAI.
​
2. Criação de Bots com OpenAI
Após configurar as credenciais, você pode criar vários bots que utilizam o sistema de triggers para iniciar as interações. Isso pode ser feito através do endpoint /openai/create/{{instance}}.
​
Endpoint para Criação de Bots
​
Endpoint
POST {{baseUrl}}/openai/create/{{instance}}
​
Corpo da Requisição
Aqui está um exemplo de como criar um bot utilizando OpenAI:
{
    "enabled": true,
    "openaiCredsId": "clyrx36wj0001119ucjjzxik1",
    "botType": "assistant",
    // para assistentes
    "assistantId": "asst_LRNyh6qC4qq8NTyPjHbcJjSp",
    "functionUrl": "https://n8n.site.com",
    // para chat completion
    "model": "gpt-4",
    "systemMessages": [
        "You are a helpful assistant."
    ],
    "assistantMessages": [
        "\n\nHello there, how may I assist you today?"
    ],
    "userMessages": [
        "Hello!"
    ],
    "maxTokens": 300,
    // opções
    "triggerType": "keyword",
    "triggerOperator": "equals",
    "triggerValue": "teste",
    "expire": 20,
    "keywordFinish": "#SAIR",
    "delayMessage": 1000,
    "unknownMessage": "Mensagem não reconhecida",
    "listeningFromMe": false,
    "stopBotFromMe": false,
    "keepOpen": false,
    "debounceTime": 10,
    "ignoreJids": []
}
​
Explicação dos Parâmetros
enabled: Ativa (true) ou desativa (false) o bot.
openaiCredsId: ID da credencial cadastrada anteriormente.
botType: Tipo do bot (assistant ou chatCompletion).
Para Assistentes (assistant):
assistantId: ID do assistente OpenAI.
functionUrl: URL que será chamada caso o assistente necessite realizar uma ação.
Para Chat Completion (chatCompletion):
model: Modelo do OpenAI a ser utilizado (ex.: gpt-4).
systemMessages: Mensagens que configuram o comportamento do bot.
assistantMessages: Mensagens iniciais do bot.
userMessages: Mensagens de exemplo do usuário.
maxTokens: Número máximo de tokens utilizados na resposta.
Opções:
triggerType: Tipo de trigger para iniciar o bot (all ou keyword).
triggerOperator: Operador utilizado para avaliar o trigger (contains, equals, startsWith, endsWith, regex, none).
triggerValue: Valor utilizado no trigger (por exemplo, uma palavra-chave ou regex).
expire: Tempo em minutos após o qual o bot expira, reiniciando se a sessão expirou.
keywordFinish: Palavra-chave que encerra a sessão do bot.
delayMessage: Delay (em milissegundos) para simular a digitação antes de enviar uma mensagem.
unknownMessage: Mensagem enviada quando a entrada do usuário não é reconhecida.
listeningFromMe: Define se o bot deve escutar as mensagens enviadas pelo próprio usuário (true ou false).
stopBotFromMe: Define se o bot deve parar quando o próprio usuário envia uma mensagem (true ou false).
keepOpen: Mantém a sessão aberta, evitando que o bot seja reiniciado para o mesmo contato.
debounceTime: Tempo (em segundos) para juntar várias mensagens em uma só.
ignoreJids: Lista de JIDs de contatos que não ativarão o bot.
​
3. Gerenciamento de Sessões do OpenAI
Você pode gerenciar as sessões do bot, alterando o status entre aberta, pausada ou fechada para cada contato específico.
​
Endpoint para Gerenciamento de Sessões
​
Endpoint
POST {{baseUrl}}/openai/changeStatus/{{instance}}
​
Corpo da Requisição
Aqui está um exemplo de como gerenciar o status da sessão:
{
    "remoteJid": "5511912345678@s.whatsapp.net",
    "status": "closed"
}
​
Explicação dos Parâmetros
remoteJid: JID (identificador) do contato no WhatsApp.
status: Status da sessão (opened, paused, closed).
​
4. Configurações Padrão do OpenAI
Você pode definir configurações padrão que serão aplicadas caso os parâmetros não sejam passados durante a criação do bot. Inclui também a opção de usar reconhecimento de fala (speech-to-text).
​
Endpoint para Configurações Padrão
​
Endpoint
POST {{baseUrl}}/openai/settings/{{instance}}
​
Corpo da Requisição
Aqui está um exemplo de configuração padrão:
{
    "openaiCredsId": "clyja4oys0a3uqpy7k3bd7swe",
    "expire": 20,
    "keywordFinish": "#SAIR",
    "delayMessage": 1000,
    "unknownMessage": "Mensagem não reconhecida",
    "listeningFromMe": false,
    "stopBotFromMe": false,
    "keepOpen": false,
    "debounceTime": 0,
    "ignoreJids": [],
    "openaiIdFallback": "clyja4oys0a3uqpy7k3bd7swe",
    "speechToText": true
}
​
Explicação dos Parâmetros
openaiCredsId: ID da credencial do OpenAI a ser usada como padrão.
expire: Tempo em minutos após o qual o bot expira.
keywordFinish: Palavra-chave que encerra a sessão do bot.
delayMessage: Delay para simular a digitação antes de enviar uma mensagem.
unknownMessage: Mensagem enviada quando a entrada do usuário não é reconhecida.
listeningFromMe: Define se o bot deve escutar as mensagens enviadas pelo próprio usuário.
stopBotFromMe: Define se o bot deve parar quando o próprio usuário envia uma mensagem.
keepOpen: Mantém a sessão aberta, evitando que o bot seja reiniciado para o mesmo contato.
debounceTime: Tempo para juntar várias mensagens em uma só.
ignoreJids: Lista de JIDs de contatos que não ativarão o bot.
openaiIdFallback: ID do bot de fallback que será utilizado caso nenhum trigger seja ativado.
speechToText: Define se a funcionalidade de reconhecimento de fala (speech-to-text) deve ser ativada usando a credencial definida por padrão.
​
Webhook com speechToText
Quando o parâmetro speechToText está ativado, a Evolution API converte automaticamente os áudios recebidos em texto utilizando a credencial do OpenAI. A transcrição do áudio é então incluída no webhook enviado pela API.
​
Exemplo de Webhook com speechToText
{
    "event": "message",
    "data": {
        "message": {
            "id": "message-id",
            "from": "sender-number",
            "to": "receiver-number",
            "content": "Text message",
            "speech

ToText": "This is the transcribed text from the audio."
        }
    }
}
​
Considerações Finais
A integração da Evolution API com o OpenAI oferece uma maneira poderosa de automatizar interações no WhatsApp, utilizando a inteligência artificial para fornecer respostas dinâmicas e personalizadas. Com as configurações corretas, você pode criar assistentes virtuais altamente eficientes, gerenciar sessões e definir configurações padrão, incluindo o uso de reconhecimento de fala para converter áudios em texto automaticamente.

Dify
A Evolution API permite a criação e gerenciamento de bots utilizando a tecnologia Dify, proporcionando automação e interatividade avançada através de diferentes tipos de bots, como chatBots, textGenerators, agents, e workflows. A seguir, você encontrará as instruções detalhadas sobre como configurar bots, gerenciar sessões e definir configurações padrão.
​
1. Criação de Bots no Dify
Você pode configurar diversos bots no Dify utilizando triggers para iniciar as interações. A configuração do bot pode ser feita através do endpoint /dify/create/{{instance}}.
​
Endpoint para Criação de Bots
​
Endpoint
POST {{baseUrl}}/dify/create/{{instance}}
​
Corpo da Requisição
Aqui está um exemplo de corpo JSON para configurar um bot no Dify:
{
    "enabled": true,
    "botType": "chatBot", /* chatBot, textGenerator, agent, workflow */
    "apiUrl": "http://dify.site.com/v1",
    "apiKey": "app-123456",
    // opções
    "triggerType": "keyword", /* all ou keyword */
    "triggerOperator": "equals", /* contains, equals, startsWith, endsWith, regex, none */
    "triggerValue": "teste",
    "expire": 0,
    "keywordFinish": "#SAIR",
    "delayMessage": 1000,
    "unknownMessage": "Mensagem não reconhecida",
    "listeningFromMe": false,
    "stopBotFromMe": false,
    "keepOpen": false,
    "debounceTime": 0,
    "ignoreJids": []
}
​
Explicação dos Parâmetros
enabled: Ativa (true) ou desativa (false) o bot.
botType: Tipo do bot Dify (chatBot, textGenerator, agent, workflow).
apiUrl: URL da API do Dify (sem a / no final).
apiKey: Chave da API fornecida pelo Dify.
Opções:
triggerType: Tipo de trigger para iniciar o bot (all ou keyword).
triggerOperator: Operador utilizado para avaliar o trigger (contains, equals, startsWith, endsWith, regex, none).
triggerValue: Valor utilizado no trigger (por exemplo, uma palavra-chave ou regex).
expire: Tempo em minutos após o qual o bot expira, reiniciando se a sessão expirou.
keywordFinish: Palavra-chave que encerra a sessão do bot.
delayMessage: Delay (em milissegundos) para simular a digitação antes de enviar uma mensagem.
unknownMessage: Mensagem enviada quando a entrada do usuário não é reconhecida.
listeningFromMe: Define se o bot deve escutar as mensagens enviadas pelo próprio usuário (true ou false).
stopBotFromMe: Define se o bot deve parar quando o próprio usuário envia uma mensagem (true ou false).
keepOpen: Mantém a sessão aberta, evitando que o bot seja reiniciado para o mesmo contato.
debounceTime: Tempo (em segundos) para juntar várias mensagens em uma só.
ignoreJids: Lista de JIDs de contatos que não ativarão o bot.
​
2. Configurações Padrão do Dify
Você pode definir configurações padrão que serão aplicadas caso os parâmetros não sejam passados durante a criação do bot.
​
Endpoint para Configurações Padrão
​
Endpoint
POST {{baseUrl}}/dify/settings/{{instance}}
​
Corpo da Requisição
Aqui está um exemplo de configuração padrão:
{
    "expire": 20,
    "keywordFinish": "#SAIR",
    "delayMessage": 1000,
    "unknownMessage": "Mensagem não reconhecida",
    "listeningFromMe": false,
    "stopBotFromMe": false,
    "keepOpen": false,
    "debounceTime": 0,
    "ignoreJids": [],
    "difyIdFallback": "clyja4oys0a3uqpy7k3bd7swe"
}
​
Explicação dos Parâmetros
expire: Tempo em minutos após o qual o bot expira.
keywordFinish: Palavra-chave que encerra a sessão do bot.
delayMessage: Delay para simular a digitação antes de enviar uma mensagem.
unknownMessage: Mensagem enviada quando a entrada do usuário não é reconhecida.
listeningFromMe: Define se o bot deve escutar as mensagens enviadas pelo próprio usuário.
stopBotFromMe: Define se o bot deve parar quando o próprio usuário envia uma mensagem.
keepOpen: Mantém a sessão aberta, evitando que o bot seja reiniciado para o mesmo contato.
debounceTime: Tempo para juntar várias mensagens em uma só.
ignoreJids: Lista de JIDs de contatos que não ativarão o bot.
difyIdFallback: ID do bot de fallback que será utilizado caso nenhum trigger seja ativado.
​
3. Gerenciamento de Sessões do Dify
Você pode gerenciar as sessões do bot, alterando o status entre aberta, pausada ou fechada para cada contato específico.
​
Endpoint para Gerenciamento de Sessões
​
Endpoint
POST {{baseUrl}}/dify/changeStatus/{{instance}}
​
Corpo da Requisição
Aqui está um exemplo de como gerenciar o status da sessão:
{
    "remoteJid": "5511912345678@s.whatsapp.net",
    "status": "closed"
}
​
Explicação dos Parâmetros
remoteJid: JID (identificador) do contato no WhatsApp.
status: Status da sessão (opened, paused, closed).
​
4. Variáveis Automáticas e Especiais no Dify
Quando uma sessão do Dify é iniciada, algumas variáveis predefinidas são automaticamente enviadas:
inputs: {
    remoteJid: "JID do contato",
    pushName: "Nome do contato",
    instanceName: "Nome da instância",
    serverUrl: "URL do servidor da API",
    apiKey: "Chave de API da Evolution"
};
​
Explicação das Variáveis Automáticas
remoteJid: JID do contato com quem o bot está interagindo.
pushName: Nome do contato no WhatsApp.
instanceName: Nome da instância que está executando o bot.
serverUrl: URL do servidor onde a Evolution API está hospedada.
apiKey: Chave de API usada para autenticar as requisições.
​
Variáveis Especiais para Workflows
No caso de bots do tipo workflow, a mensagem recebida é enviada na variável query dentro dos inputs. Isso permite que o workflow processe a mensagem diretamente com base no conteúdo da variável query.
​
Exemplo de Variáveis para Workflow
inputs: {
    remoteJid: "JID do contato",
    pushName: "Nome do contato",
    instanceName: "Nome da instância",
    serverUrl: "URL do servidor da API",
    apiKey: "Chave de API da Evolution",
    query: "Conteúdo da mensagem recebida"
}
​
Considerações Finais
A integração da Evolution API com o Dify oferece uma maneira robusta de automatizar interações no WhatsApp, utilizando diferentes tipos de bots para atender às necessidades específicas do seu negócio. Com a capacidade de configurar triggers, gerenciar sessões e utilizar variáveis automáticas, você pode otimizar o fluxo de trabalho e melhorar a experiência do usuário final.

Flowise
A Evolution API permite a criação e gerenciamento de bots utilizando a tecnologia Flowise, proporcionando automação e interatividade avançada através de diferentes tipos de interações. A seguir, você encontrará as instruções detalhadas sobre como configurar bots, gerenciar sessões e definir configurações padrão.
​
1. Criação de Bots no Flowise
Você pode configurar diversos bots no Flowise utilizando triggers para iniciar as interações. A configuração do bot pode ser feita através do endpoint /flowise/create/{{instance}}.
​
Endpoint para Criação de Bots
​
Endpoint
POST {{baseUrl}}/flowise/create/{{instance}}
​
Corpo da Requisição
Aqui está um exemplo de corpo JSON para configurar um bot no Flowise:
{
    "enabled": true,
    "apiUrl": "http://flowise.site.com/v1",
    "apiKey": "app-123456", // optional
    // opções
    "triggerType": "keyword", /* all ou keyword */
    "triggerOperator": "equals", /* contains, equals, startsWith, endsWith, regex, none */
    "triggerValue": "teste",
    "expire": 0,
    "keywordFinish": "#SAIR",
    "delayMessage": 1000,
    "unknownMessage": "Mensagem não reconhecida",
    "listeningFromMe": false,
    "stopBotFromMe": false,
    "keepOpen": false,
    "debounceTime": 0,
    "ignoreJids": []
}
​
Explicação dos Parâmetros
enabled: Ativa (true) ou desativa (false) o bot.
apiUrl: URL da API do Flowise (sem a / no final).
apiKey: Chave da API fornecida pelo Flowise (opcional).
Opções:
triggerType: Tipo de trigger para iniciar o bot (all ou keyword).
triggerOperator: Operador utilizado para avaliar o trigger (contains, equals, startsWith, endsWith, regex, none).
triggerValue: Valor utilizado no trigger (por exemplo, uma palavra-chave ou regex).
expire: Tempo em minutos após o qual o bot expira, reiniciando se a sessão expirou.
keywordFinish: Palavra-chave que encerra a sessão do bot.
delayMessage: Delay (em milissegundos) para simular a digitação antes de enviar uma mensagem.
unknownMessage: Mensagem enviada quando a entrada do usuário não é reconhecida.
listeningFromMe: Define se o bot deve escutar as mensagens enviadas pelo próprio usuário (true ou false).
stopBotFromMe: Define se o bot deve parar quando o próprio usuário envia uma mensagem (true ou false).
keepOpen: Mantém a sessão aberta, evitando que o bot seja reiniciado para o mesmo contato.
debounceTime: Tempo (em segundos) para juntar várias mensagens em uma só.
ignoreJids: Lista de JIDs de contatos que não ativarão o bot.
​
2. Configurações Padrão do Flowise
Você pode definir configurações padrão que serão aplicadas caso os parâmetros não sejam passados durante a criação do bot.
​
Endpoint para Configurações Padrão
​
Endpoint
POST {{baseUrl}}/flowise/settings/{{instance}}
​
Corpo da Requisição
Aqui está um exemplo de configuração padrão:
{
    "expire": 20,
    "keywordFinish": "#SAIR",
    "delayMessage": 1000,
    "unknownMessage": "Mensagem não reconhecida",
    "listeningFromMe": false,
    "stopBotFromMe": false,
    "keepOpen": false,
    "debounceTime": 0,
    "ignoreJids": [],
    "flowiseIdFallback": "clyja4oys0a3uqpy7k3bd7swe"
}
​
Explicação dos Parâmetros
expire: Tempo em minutos após o qual o bot expira.
keywordFinish: Palavra-chave que encerra a sessão do bot.
delayMessage: Delay para simular a digitação antes de enviar uma mensagem.
unknownMessage: Mensagem enviada quando a entrada do usuário não é reconhecida.
listeningFromMe: Define se o bot deve escutar as mensagens enviadas pelo próprio usuário.
stopBotFromMe: Define se o bot deve parar quando o próprio usuário envia uma mensagem.
keepOpen: Mantém a sessão aberta, evitando que o bot seja reiniciado para o mesmo contato.
debounceTime: Tempo para juntar várias mensagens em uma só.
ignoreJids: Lista de JIDs de contatos que não ativarão o bot.
flowiseIdFallback: ID do bot de fallback que será utilizado caso nenhum trigger seja ativado.
​
3. Gerenciamento de Sessões do Flowise
Você pode gerenciar as sessões do bot, alterando o status entre aberta, pausada ou fechada para cada contato específico.
​
Endpoint para Gerenciamento de Sessões
​
Endpoint
POST {{baseUrl}}/flowise/changeStatus/{{instance}}
​
Corpo da Requisição
Aqui está um exemplo de como gerenciar o status da sessão:
{
    "remoteJid": "5511912345678@s.whatsapp.net",
    "status": "closed"
}
​
Explicação dos Parâmetros
remoteJid: JID (identificador) do contato no WhatsApp.
status: Status da sessão (opened, paused, closed).
​
4. Variáveis Automáticas e Especiais no Flowise
Quando uma sessão do Flowise é iniciada, algumas variáveis predefinidas são automaticamente enviadas:
inputs: {
    remoteJid: "JID do contato",
    pushName: "Nome do contato",
    instanceName: "Nome da instância",
    serverUrl: "URL do servidor da API",
    apiKey: "Chave de API da Evolution"
};
​
Explicação das Variáveis Automáticas
remoteJid: JID do contato com quem o bot está interagindo.
pushName: Nome do contato no WhatsApp.
instanceName: Nome da instância que está executando o bot.
serverUrl: URL do servidor onde a Evolution API está hospedada.
apiKey: Chave de API usada para autenticar as requisições.
​
Variáveis Especiais para Workflows
No caso de bots do tipo workflow, a mensagem recebida é enviada na variável query dentro dos inputs. Isso permite que o workflow processe a mensagem diretamente com base no conteúdo da variável query.
​
Exemplo de Variáveis para Workflow
inputs: {
    remoteJid: "JID do contato",
    pushName: "Nome do contato",
    instanceName: "Nome da instância",
    serverUrl: "URL do servidor da API",
    apiKey: "Chave de API da Evolution",
    query: "Conteúdo da mensagem recebida"
}
​
Considerações Finais
A integração da Evolution API com o Flowise oferece uma maneira robusta de automatizar interações no WhatsApp, utilizando diferentes tipos de bots para atender às necessidades específicas do seu negócio. Com a capacidade de configurar triggers, gerenciar sessões e utilizar variáveis automáticas, você pode otimizar o fluxo de trabalho e melhorar a experiência do usuário final.

WhatsApp Cloud API
A Evolution API v2 permite integrar sua aplicação com a Cloud API oficial do WhatsApp para gerenciar mensagens, contatos, e outras funcionalidades diretamente através da API. A seguir, são detalhados os pré-requisitos e o processo de integração.
​
Pré-requisitos
Antes de iniciar a integração com a Cloud API do WhatsApp, você deve garantir que os seguintes passos foram concluídos:
​
1. Criação da Business Manager (BM) e Aprovação
Para utilizar a Cloud API oficial do WhatsApp, você precisa de uma Business Manager (BM) aprovada. Este processo envolve:
Criar uma conta no Facebook Business Manager.
Seguir os passos para verificação da sua empresa.
Aguardar a aprovação da sua conta.
​
2. Criação do App no Facebook Developers
Após a aprovação da sua BM, você precisa criar um aplicativo na plataforma Facebook Developers:
Acesse a sua conta do Facebook Developers e clique em Meus Apps.
Clique em Criar App e siga as instruções para configurar um novo aplicativo.
Certifique-se de adicionar a API do WhatsApp ao seu aplicativo.
​
3. Configuração do Número no Aplicativo
Após criar o aplicativo, você precisa configurar o número do WhatsApp:
No painel do seu aplicativo no Facebook Developers, vá para a seção WhatsApp.
Adicione e verifique o número de telefone que deseja usar com a Cloud API.
Anote o Number ID fornecido.
​
4. Criar um Token Permanente
Para evitar que o token de acesso expire, crie um token permanente para o usuário admin da sua BM:
Vá para a seção Tokens de Acesso no Facebook Developers.
Gere um token com as permissões necessárias para a API do WhatsApp.
Certifique-se de que este token é permanente, para não precisar ser renovado periodicamente.
​
Configuração na Evolution API v2
Agora que você completou os pré-requisitos, siga os passos abaixo para configurar a integração com a Evolution API v2.
​
1. Criação da Instância
Para criar uma instância que utiliza a Cloud API do WhatsApp, você precisará acessar a rota /instance/create da Evolution API v2 com o seguinte corpo de requisição:
{
    "instanceName": "NOME DA INSTANCIA",
    "token": "TOKEN PERMANENTE DO USUARIO ADMIN DA BM",
    "number": "NUMBER ID DO WHATSAPP",
    "businessId": "BUSINESS ID DA CONTA DO WHATSAPP",
    "qrcode": false,
    "integration": "WHATSAPP-BUSINESS"
}
​
Parâmetros do Corpo da Requisição:
instanceName: Nome da instância que você está criando.
token: Token permanente gerado para o usuário admin da sua BM.
number: Number ID do WhatsApp que você configurou no aplicativo do Facebook Developers.
businessId: ID da conta de negócios associada ao WhatsApp.
qrcode: Defina como false pois a integração é baseada em token, e não em QR Code.
integration: Use "WHATSAPP-BUSINESS" para especificar que esta integração é com a API oficial do WhatsApp Business.
​
Exemplo de Requisição:
curl -X POST http://API_URL/instance/create \
-H "Content-Type: application/json" \
-d '{
    "instanceName": "MinhaInstancia",
    "token": "EAAGm0PX4ZCpsBA...",
    "number": "1234567890",
    "businessId": "9876543210",
    "qrcode": false,
    "integration": "WHATSAPP-BUSINESS"
}'
​
2. Configuração do Webhook
Depois de criar a instância, é necessário configurar o webhook no aplicativo da Meta para receber eventos e mensagens do WhatsApp.
​
URL do Webhook
No painel do seu aplicativo no Facebook Developers, configure o webhook com a seguinte URL:
API_URL/webhook/meta
​
Token do Webhook
O token para validar o webhook deve ser configurado na variável WA_BUSINESS_TOKEN_WEBHOOK no seu arquivo .env:
WA_BUSINESS_TOKEN_WEBHOOK=seu_token_webhook
Este token será usado pela Meta para validar as requisições enviadas para o seu webhook.
​
Conclusão
Com a instância criada e o webhook configurado, a sua Evolution API v2 está pronta para operar com a Cloud API oficial do WhatsApp. Todas as mensagens e eventos relacionados ao número configurado serão gerenciados automaticamente pela Evolution API.
Esta documentação fornece uma visão clara e detalhada de como integrar a Cloud API do WhatsApp com a Evolution API v2, desde a preparação necessária até a configuração final. Se você seguir todas as etapas, estará preparado para utilizar as funcionalidades do WhatsApp em sua aplicação através da Evolution API v2.

Canal Evolution
O Evolution Channel é um canal universal de integração que permite a entrada de mensagens através de webhooks, proporcionando flexibilidade para conectar diversos sistemas e aplicativos com a Evolution API. Este canal facilita a automação e o gerenciamento de mensagens, suportando diversas integrações e fluxos de trabalho.
​
1. Configuração da Instância Evolution
Para configurar uma instância no Evolution Channel, você precisará acessar a rota /instance/create da Evolution API com o seguinte corpo de requisição:
​
Criação da Instância
Endpoint
POST {{baseUrl}}/instance/create
Corpo da Requisição
Aqui está um exemplo de como criar uma instância no Evolution Channel:
{
    "instanceName": "NOME DA INSTANCIA",
    "token": "TOKEN DA INSTANCIA (OPCIONAL)",
    "number": "NUMBER ID DA INSTANCIA",
    "qrcode": false,
    "integration": "EVOLUTION"
}
​
Parâmetros do Corpo da Requisição
instanceName: Nome da instância que você está criando.
token: Token opcional para autenticar a instância.
number: Number ID da instância que será utilizado para receber e enviar mensagens.
qrcode: Defina como false pois a integração não requer QR Code.
integration: Use "EVOLUTION" para especificar que esta integração é com o canal universal Evolution.
Exemplo de Requisição
curl -X POST http://API_URL/instance/create \
-H "Content-Type: application/json" \
-d '{
    "instanceName": "MinhaInstancia",
    "token": "123456",
    "number": "9876543210",
    "qrcode": false,
    "integration": "EVOLUTION"
}'
​
2. Entrada de Mensagens no Evolution Channel
Após a criação da instância, o Evolution Channel receberá as mensagens enviadas para a instância configurada. Essas mensagens são enviadas para a rota {baseUrl}/webhook/evolution como requisições POST. Este é o ponto de entrada para as mensagens que o Evolution Channel irá processar.
URL do Webhook para Entrada de Mensagens
POST {{baseUrl}}/webhook/evolution
​
Exemplo de Payload de Entrada de Mensagem
Aqui está um exemplo do formato de payload enviado para o Evolution Channel quando uma mensagem é recebida:
{
    "numberId": "1234567",
    "key": {
        "remoteJid": "557499879409",
        "fromMe": false,
        "id": "ABC1234"
    },
    "pushName": "Davidson",
    "message": {
        "conversation": "Qual o seu nome?"
    },
    "messageType": "conversation"
}
​
Explicação dos Campos do Payload
numberId: ID do número cadastrado na criação da instância.
key.remoteJid: Número ou ID único do contato que enviou a mensagem.
key.fromMe: Indica se a mensagem foi enviada pelo contato (false) ou pelo próprio sistema (true).
key.id: ID único da mensagem.
pushName: Nome do contato que enviou a mensagem.
message.conversation: Conteúdo da mensagem recebida.
messageType: Tipo da mensagem (neste caso, conversation).
​
3. Feedback e Postbacks
O Evolution Channel envia feedback e postbacks através dos canais de eventos configurados, como webhooks, RabbitMQ, ou SQS. Isso permite que você receba notificações em tempo real sobre o status das mensagens e interações, mantendo seu sistema atualizado.
Exemplos de Canais de Eventos
Webhook: Notificações são enviadas para um endpoint HTTP especificado.
RabbitMQ: Mensagens são enviadas para uma fila RabbitMQ configurada.
SQS: Mensagens são enviadas para uma fila SQS da AWS.
Configuração de Canais de Eventos Para configurar os canais de eventos, defina os parâmetros necessários no seu arquivo de configuração ou diretamente na instância, conforme as especificações da Evolution API.
​
Conclusão
Com a instância criada e a configuração do webhook de entrada de mensagens, a sua Evolution API está pronta para operar com o Evolution Channel. Todas as mensagens recebidas e os eventos associados serão gerenciados de forma centralizada, permitindo uma integração fluida e eficiente com seus sistemas de mensagens e automação.
Esta documentação fornece uma visão clara e detalhada de como integrar o Evolution Channel com a Evolution API, desde a criação da instância até a configuração dos webhooks e canais de eventos. Seguindo estas etapas, você estará preparado para utilizar o canal universal Evolution em sua aplicação.

S3/Minio
A Evolution API suporta a integração com Amazon S3 ou Minio para armazenar arquivos de mídia do WhatsApp, como imagens, áudios e documentos. Essa integração permite que os arquivos sejam armazenados de forma segura e acessível, com links gerados automaticamente e incluídos nos webhooks enviados pela API.
​
Configuração de Variáveis de Ambiente
Para habilitar o armazenamento S3 ou Minio, você deve definir as variáveis de ambiente adequadas no arquivo .env da Evolution API. Abaixo estão as variáveis necessárias e suas funções:
​
Variáveis de Configuração para S3
S3_ENABLED=true
S3_ACCESS_KEY=lJiKQSKlco6UfSUJSnZt
S3_SECRET_KEY=gZXkzkXQwhME8XEmZVNF0ImSWxIpbXeJ5UoPy4s1
S3_BUCKET=evolution
S3_PORT=443
S3_ENDPOINT=s3.eu-west-3.amazonaws.com
S3_USE_SSL=true
S3_REGION=eu-west-3
​
Explicação das Variáveis
S3_ENABLED: Ativa (true) ou desativa (false) o uso do S3 ou Minio para armazenamento de arquivos.
S3_ACCESS_KEY: Chave de acesso fornecida pelo provedor do serviço (AWS ou Minio).
S3_SECRET_KEY: Chave secreta correspondente à chave de acesso, usada para autenticação.
S3_BUCKET: Nome do bucket onde os arquivos serão armazenados.
S3_PORT: Porta utilizada para a conexão. Normalmente 443 para conexões SSL.
S3_ENDPOINT: Endpoint do serviço S3 ou Minio. Para Amazon S3, é necessário incluir a região no formato region: s3.[region].amazonaws.com, por exemplo, s3.eu-west-3.amazonaws.com.
S3_USE_SSL: Define se a conexão deve usar SSL (true ou false).
S3_REGION: A região do bucket S3 (padrão é us-east-1).
​
Exemplos de Configuração
​
Amazon S3
Ao utilizar o Amazon S3, é essencial especificar o endpoint corretamente, incluindo a região. Aqui está um exemplo:
S3_ENABLED=true
S3_ACCESS_KEY=your-aws-access-key
S3_SECRET_KEY=your-aws-secret-key
S3_BUCKET=my-s3-bucket
S3_PORT=443
S3_ENDPOINT=s3.eu-west-3.amazonaws.com
S3_USE_SSL=true
S3_REGION=eu-west-3
​
Minio
Para Minio, o endpoint pode ser o domínio personalizado do serviço:
S3_ENABLED=true
S3_ACCESS_KEY=your-minio-access-key
S3_SECRET_KEY=your-minio-secret-key
S3_BUCKET=my-minio-bucket
S3_PORT=443
S3_ENDPOINT=minio.mycompany.com
S3_USE_SSL=true
​
Como Funciona o Armazenamento de Mídia
Quando o armazenamento S3 ou Minio é configurado corretamente, todos os arquivos de mídia recebidos do WhatsApp (como imagens, vídeos, áudios, etc.) são automaticamente enviados para o bucket configurado. A URL pública do arquivo armazenado é então gerada e incluída no webhook da Evolution API.
​
Webhook com mediaUrl
Quando um arquivo de mídia é recebido e armazenado, o webhook enviado pela Evolution API incluirá o mediaUrl no corpo da mensagem. Isso permite que sua aplicação acesse diretamente o arquivo armazenado no S3 ou Minio.
​
Exemplo de Webhook
Aqui está um exemplo de como o webhook com mediaUrl pode aparecer:
{
    "event": "messages.upsert",
    "data": {
        "message": {
            ...
            "mediaUrl": "https://files.evolution-api-pro.com/bucket/path/to/media/file.jpg",
            ...
        }
    }
}
​
Considerações Finais
Integrar a Evolution API com Amazon S3 ou Minio para o armazenamento de arquivos de mídia oferece uma solução escalável e segura para gerenciar conteúdos de mídia do WhatsApp. Ao configurar as variáveis de ambiente corretamente, você garante que todos os arquivos de mídia sejam armazenados e acessíveis conforme necessário, proporcionando maior controle sobre os dados e a capacidade de integrá-los facilmente em suas aplicações.

Community Node N8N
Como instalar o node comunitário do Evolution API no N8N

Integre a Evolution API diretamente nos seus fluxos do N8N utilizando o node comunitário oficial.
​
Pré-requisitos
Instância do N8N em funcionamento
Evolution API instalada e acessível
​
Instalação
1
Acessar configurações

No N8N, navegue até Settings > Community Nodes (/settings/community-nodes)
2
Iniciar instalação

Clique em Install
3
Informar o pacote

No campo de instalação, digite:
n8n-nodes-evolution-api
4
Aceitar termos e instalar

Aceite o termo de uso e clique em Install
​
Usando o node
Após o processo de instalação, o node estará disponível nos seus fluxos. Para localizá-lo, pesquise por “Evolution API” na barra de busca de nodes do N8N.