CENTRO UNIVERSITÁRIO CATÓLICA DO LESTE DE MINAS GERAIS

Documentação de Desenvolvimento do Projeto de Sistemas Móveis

APP DE GESTÃO DE FINANÇAS DOMÉSTICA

Arthur Bergamini Luzia  
José Geraldo Duarte Junior  
Maria Eduarda de Souza Martins  
Pedro Henrique Soares Lacerda Sardanha  
Yan Roger Fogaça Vieira 

Coronel Fabriciano \- MG / 2026

1. **DEFINIÇÃO DO PROBLEMA**   
   

Geralmente as famílias enfrentam dificuldades para controlar e gerenciar gastos financeiros do lar, pois normalmente as despesas são realizadas por pessoas diferentes e nem sempre são compartilhadas ou registradas de maneira clara. Pensando nisso, essa aplicação tem como objetivo, registrar gastos e calcular automáticamente, os custos mensais dos usuários, evitando confusões relacionadas ao seu controle financeiro.   
Além disso, a aplicação permitirá que o usuário envie um código de convite para que outros usuários possam ter acesso àquele mesmo controle financeiro. Tendo em vista que, isso evitará confusões e promoverá transparência entre os moradores.

2.  **PÚBLICO-ALVO** 

Famílias que desejam compartilhar gastos; casais que compartilham despesas; jovens que dividem moradia e despesas simples; pessoas que desejam compartilhar gastos. 

3. **REQUISITOS INICIAIS**  
     
   

| Tabela Requisitos Funcionais |  |  |
| :---- | :---- | :---- |
| **ID** | **Nome** | **Descrição** |
| FR01 | Cadastro de usuário | O sistema deve permitir que um usuário crie uma conta no aplicativo. |
| RF02 | Autenticação usuário | O usuário deve permitir a realização do login utilizando a autenticação gerenciada pela Supabase. |
| RF03 | Autenticação biometria | Após o primeiro login bem sucedido, o sistema deve permitir que o usuário habilite o acesso ao aplicativo utilizando autenticação biométrica do dispositivo. |
| RF04 | Criação de Casa | O sistema deve permitir que o usuário crie uma nova casa no sistema, tornando-se automaticamente o administrador dessa casa. |
| RF05 | Entrada em Case Existente | O sistema deve permitir que um usuário entre em uma casa existente através de um código de convite. |
| RF06 | Restrição de Associação de Casa | Cada usuário pode estar associado a apenas uma casa por vez dentro do sistema. |
| RF07 | Saída de Casa | O sistema deve permitir que um usuário saia da casa da qual faz parte. Ao sair,suas responsabilidades sobre despesas são removidas e as despesas cadastradas por ele permanecem registradas no sistema. |
| RF08 | Gerenciamento participantes | O criador da casa (administrador) deve poder gerenciar os participantes da residência. |
| RF09 | Adicionar participantes | O administrador deve poder adicionar novos participantes à casa através de um código de convite. |
| RF10 | Remover participantes | O administrador deve poder remover participantes da casa, mantendo o histórico financeiro previamente registrado. |
| RF11 | Cadastro de despesas | O sistema deve permitir cadastrar despesas da casa informando nome da despesa, valor, data de vencimento, responsável e categoria. |
| RF12 | Alteração de status da despesa | O sistema deve permitir alterar o status de uma despesa para paga ou pendente. |
| RF13 | Definir responsável pela despesa | O sistema deve permitir associar um morador responsável por cada despesa. |
| RF14 | Saldo da casa | O sistema deve permitir registrar e gerenciar um saldo disponível para a casa. |
| RF15 | Visualizar lista de despesas | O sistema deve permitir que os usuários visualizem todas as despesas da casa. |
| RF16 | Relatório de gastos mensais | O sistema deve permitir gerar um relatório com os gastos totais do mês. |
| RF17 | Categoria de despesas | O sistema deve permitir classificar despesas em categorias como alimentação, energia, água, aluguel, internet e outros. |
| RF18 | Divisão automática de despesas | O  sistema deve permitir dividir automaticamente o valor de uma despesa entre os moradores da casa. |
| RF19 | Notificação de contas | O sistema deve enviar notificações quando uma despesa estiver próxima da data de vencimento. |
| RF20 | Visualização de gráficos de gastos | O sistema deve permitir visualizar gráficos que representam os gastos por categoria ou por período. |
| RF21 | Histórico de pagamentos | O sistema deve permitir consultar o histórico de despesas pagas e pendentes. |
| RF22 | Exportação de relatórios | O sistema deve permitir exportar relatórios financeiros em formato PDF ou imagem. |

   

   

| Tabela de Requisitos não Funcionais |  |
| :---- | :---- |
| RNF-01 | Interface simples e intuitiva |
| RNF-02 | Fácil navegação em dispositivos móveis |
| RNF-03 | Atualização das informações em tempo real entre os usuários |
| RNF-04 | Segurança no acesso aos dados financeiros |

   

4. **PROTÓTIPO NAVEGÁVEL**   
   [Clique aqui](https://ai.studio/apps/1ebc6739-36fb-4114-8277-cb0370d33f83) para acessar o nosso protótipo navegável.  
     
5. **LISTA DE INTEGRANTES**  
     
   Arthur Bergamini Luzia  
   José Geraldo Duarte Junior  
   Maria Eduarda de Souza Martins  
   Pedro Henrique Soares Lacerda Sardanha  
   Yan Roger Fogaça Vieira   
     
6. **ARQUITETURA PRELIMINAR** 

O sistema será estruturado seguindo o modelo de arquitetura cliente-servidor, sendo composto por duas camadas principais: frontend, responsável pela interface com o usuário, e backend, responsável pelas regras de negócio, segurança e persistência de dados.

Essa separação permite maior organização do sistema, facilitando a manutenção, escalabilidade e evolução da aplicação ao longo do desenvolvimento.

# **6.1.  BackEnd**

O backend será desenvolvido em *Java,* utilizando o framework *Spring Boot,* responsável pela criação da API que realizará o processamento das requisições enviadas pelo aplicativo móvel.

A aplicação seguirá uma organização inspirada no padrão *Model–View–Controller*, adaptado para APIs REST, sendo estruturada nas seguintes camadas:

| 6.2. Tabela: Arquitetura do BackEnd |  |  |
| ----- | ----- | ----- |
| **Controller** | **Service** | **Repository** |
| Responsável por receber as **requisições HTTP** provenientes do aplicativo móvel, encaminhar as chamadas para a camada de serviço e retornar as respostas da API ao cliente. | Camada responsável pela implementação das **regras de negócio da aplicação**, incluindo validação de dados, controle de despesas, processamento de informações financeiras e geração de dados para relatórios. | Responsável pela **comunicação com o banco de dados**, realizando operações de persistência, consulta e atualização das informações armazenadas. |

O sistema utilizará o banco de dados **PostgreSQL** para armazenamento estruturado das informações, como usuários, grupos familiares e registros de despesas.

# **6.3. Integração com Autenticação**

Para o gerenciamento de autenticação dos usuários será utilizado o serviço *Supabase*, responsável pela criação e gerenciamento de contas.

Nesse contexto, o backend terá as seguintes responsabilidades:

* Validar os tokens de autenticação gerados pelo Supabase;

* Identificar o usuário autenticado em cada requisição;

* Garantir a segurança e autorização de acesso aos recursos da aplicação.

## **6.4. Responsabilidades do Backend**

O backend será responsável por:

* Gerenciar casas ou grupos familiares;

* Registrar e armazenar despesas financeiras;

* Realizar consultas e agregações de dados;

* Aplicar regras de negócio relacionadas ao controle financeiro;

* Gerar informações utilizadas em relatórios e gráficos financeiros.

# **6.5. Frontend**

O frontend será desenvolvido como um aplicativo móvel utilizando *React Native* com o ambiente de desenvolvimento *Expo*, permitindo a criação de interfaces multiplataforma para dispositivos móveis.

O aplicativo será responsável por:

* Apresentar a interface gráfica ao usuário;

* Permitir o registro e visualização de despesas;

* Exibir relatórios e resumos financeiros;

* Gerenciar a interação com os recursos do dispositivo.

# **6.6. Comunicação entre Frontend e Backend**

A comunicação entre o aplicativo móvel e o backend ocorre por meio de *requisições HTTP para a API,* seguindo um modelo baseado em chamadas de operações específicas (similar ao conceito de **RPC – Remote Procedure Call**).

Entre as principais operações realizadas pelo aplicativo estão:

* criação de novas despesas;

* consulta de gastos registrados;

* atualização de informações financeiras;

* geração de relatórios e resumos de despesas.

Dessa forma, a  arquitetura da aplicação segue o modelo cliente-servidor, no qual o frontend é responsável pela interação com o usuário e o backend concentra as regras de negócio, processamento das informações e persistência de dados.

| FrontEnd | BackEnd |
| ----- | ----- |
| Responsável por fornecer a **interface gráfica do aplicativo**, permitindo que o usuário interaja com o sistema de forma simples e intuitiva por meio de telas, botões, formulários e elementos visuais. | Responsável por processar as **requisições enviadas pelo aplicativo**, executando as regras de negócio necessárias para atender às funcionalidades solicitadas pelo usuário. |
| Permite que o usuário **registre, visualize e gerencie despesas financeiras**, exibindo as informações de maneira organizada e compreensível. | Realiza o **processamento das informações financeiras**, validando os dados recebidos e aplicando regras relacionadas ao controle de despesas e organização dos registros. |
| Envia **requisições HTTP para a API** sempre que o usuário executa uma ação no aplicativo, como cadastrar uma despesa ou consultar o histórico de gastos. | Recebe as requisições HTTP enviadas pelo aplicativo, processa os dados e retorna as **respostas da API**, normalmente em formato estruturado para ser interpretado pelo aplicativo móvel. |
| Exibe **resumos financeiros, relatórios e gráficos de gastos**, permitindo que o usuário visualize a situação financeira da casa ou grupo familiar. | Responsável por **gerar e organizar os dados utilizados nos relatórios**, realizando cálculos e agregações necessárias para apresentar informações financeiras consolidadas. |
| Gerencia a **experiência do usuário (UX)**, garantindo que a navegação no aplicativo seja clara, rápida e adequada para dispositivos móveis. | Gerencia a **lógica central do sistema**, garantindo que todas as operações sejam executadas de forma consistente, segura e de acordo com as regras definidas para a aplicação. |
| Pode utilizar **recursos nativos do dispositivo**, como autenticação biométrica, notificações e funcionalidades específicas do sistema operacional. | Responsável por garantir a **segurança e integridade dos dados**, validando autenticação, verificando permissões de acesso e controlando o armazenamento das informações no banco de dados. |
| Atua principalmente no **lado do cliente**, focando na apresentação das informações e na interação direta com o usuário. | Atua no **lado do servidor**, concentrando o processamento das regras de negócio, a comunicação com o banco de dados e o gerenciamento das informações do sistema. |

7. **TECNOLOGIAS PRETENDIDAS**

| FrontEnd | BackEnd | Autenticação | Banco de Dados |
| ----- | ----- | ----- | ----- |
| Expo; React Native; JavaScript / TypeScript; Bibliotecas de interface mobile; APIs de biometria do dispositivo (via Expo); API de cofre de dados (via Expo).  | Java; Spring Boot; Arquitetura MVC (Controller, Service e Repository); | Supabase Auth; | PostgreSQL; |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

   

   1. **USO DE IA GENERATIVA**

O projeto está aberto ao uso de IA generativa como meio de apoio ao desenvolvedor, este que está impossibilitado de utilizar a IA para substituir seu trabalho. A Inteligência Artificial Generativa será utilizada como .ferramenta de trabalho com as seguintes funcionalidades:

* **Code Review:** Correção e revisão de código, garantindo qualidade e eficiência na entrega.  
* **Pesquisa de Algoritmos:** Pesquisar e desenvolver algoritmos complexos que estejam fora da capacidade técnica do desenvolvedor, assim reduzindo o tempo de pesquisas em fóruns e wikis.  
* **Mocks e Protótipos:** Como o time não se dispõe de um time de produtos e design para análises criteriosas de personas, e desenvolvimento de UIs, ferramentas de IA serão utilizadas para desenvolver estes cargos, validando e sugerindo funcionalidades junto de seus protótipos visuais.