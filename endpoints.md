# Home Finance API

API para gerenciamento financeiro residencial. 

- Versão: 1.0.0   
- OAS: 3.0   
- Servidor base: `https://home-finance-api-dwmz.onrender.com` 

---

## Reports

### GET `/reports/expense-report`

Gera um relatório detalhado das despesas do mês atual, incluindo total por categoria, evolução mensal e resumo geral. 

- Autenticação: requerida.   

#### URL

```http
GET https://home-finance-api-dwmz.onrender.com/reports/expense-report
```

#### Parâmetros

- Query: nenhum.   
- Path: nenhum.   

O relatório é gerado a partir da casa e do usuário autenticados, para o mês atual. 

#### Respostas

- `200 OK` – Relatório gerado com sucesso. 

  Corpo (schema `ExpensesReportResponse`):

  ```json
  {
    "categoryExpenses": [
      {
        "category": "string",
        "totalAmount": 0
      }
    ],
    "monthlyExpenses": [
      {
        "month": "string",
        "totalExpense": 0
      }
    ],
    "monthExpensesResume": {
      "monthTotalExpenses": 0,
      "biggestExpenseTitle": "string",
      "expenseStatus": "PENDING"
    }
  }
  ```

- `404 Not Found` – Usuário ou casa não encontrados. 

  ```json
  {
    "message": "string"
  }
  ```

- `500 Internal Server Error` – Erro interno do servidor. 

  ```json
  {
    "message": "string"
  }
  ```

---

## House

Endpoints relacionados a controle das residências. 

### POST `/house/join`

Entrar em uma residência usando código de convite. 

#### URL

```http
POST https://home-finance-api-dwmz.onrender.com/house/join
```

#### Parâmetros

- Query: nenhum.   
- Path: nenhum.   
- Body: objeto contendo o código da residência (ex.: `{"inviteCode": "string"}` – nome exato depende do schema `CreateHouseRequestBody` ou equivalente). 

#### Respostas

- `200 OK` – Entrada na residência realizada com sucesso (provavelmente retorna informações da casa, seguindo `HouseDTO`).   
- Erros comuns: `400` (código inválido), `401` (não autenticado), `404` (casa não encontrada). 

---

### POST `/house/create`

Criar nova residência. 

#### URL

```http
POST https://home-finance-api-dwmz.onrender.com/house/create
```

#### Parâmetros

- Query: nenhum.   
- Path: nenhum.   
- Body: `CreateHouseRequestBody` (nome, descrição, saldo inicial, etc., conforme schema). 

#### Respostas

- `200 OK` – Casa criada com sucesso (`HouseDTO`).   
- Erros comuns: `400` (dados inválidos), `401` (não autenticado). 

---

### PATCH `/house/balance`

Atualizar saldo da residência manualmente. 

#### URL

```http
PATCH https://home-finance-api-dwmz.onrender.com/house/balance
```

#### Parâmetros

- Query: nenhum.   
- Path: nenhum.   
- Body: objeto com novo saldo (schema `UpdateHouseBalanceResponse` / request correspondente). 

#### Respostas

- `200 OK` – Saldo atualizado com sucesso.   
- `401` – Não autorizado. 

---

### GET `/house/resume`

Obter resumo financeiro da residência. 

#### URL

```http
GET https://home-finance-api-dwmz.onrender.com/house/resume
```

#### Parâmetros

- Query: nenhum.   
- Path: nenhum. 

#### Respostas

- `200 OK` – Resumo retornado com sucesso (`HouseResumeDTO`, com campos como `ExpenseResume`, `MonthPaidExpensesResume`, `PendingExpensesResume`, etc.).   

---

### GET `/house/my-house`

Obter residência ativa do usuário. 

#### URL

```http
GET https://home-finance-api-dwmz.onrender.com/house/my-house
```

#### Parâmetros

- Nenhum. 

#### Respostas

- `200 OK` – Retorna `HouseDTO` com dados da casa ativa.   
- `404` – Usuário sem casa ativa. 

---

### DELETE `/house/remove-member`

Remover membro da residência (apenas para administradores da casa). 

#### URL

```http
DELETE https://home-finance-api-dwmz.onrender.com/house/remove-member
```

#### Parâmetros

- Query ou body: identificação do membro a ser removido (userId / memberId, conforme schema).   
- Path: nenhum. 

#### Respostas

- `200 OK` – Membro removido com sucesso (`LeaveHouseResponse` ou similar).   
- `403` – Usuário não é administrador da casa. 

---

### DELETE `/house/leave`

Deixar residência atual. 

#### URL

```http
DELETE https://home-finance-api-dwmz.onrender.com/house/leave
```

#### Parâmetros

- Nenhum. 

#### Respostas

- `200 OK` – Saída da residência concluída (`LeaveHouseResponse`).   

---

## Expenses

Endpoints relacionados a despesas. 

### GET `/expenses`

Obter despesas da casa. 

Retorna uma lista de despesas da casa do usuário autenticado, com filtros. 

#### URL

```http
GET https://home-finance-api-dwmz.onrender.com/expenses
```

#### Parâmetros de query

Todos obrigatórios segundo o Swagger. 

- `status` (string, required): Status da despesa para filtrar (`PENDING`, `PAID`).   
- `month` (integer, required): Mês para filtrar (1–12).   
- `year` (integer, required): Ano para filtrar (ex.: 2024).   
- `responsibleId` (string, required): ID do responsável para filtrar despesas. 

#### Respostas

- `200 OK` – Despesas obtidas com sucesso. 

  Exemplo (array de `ExpenseDTO`):

  ```json
  [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "amount": 0,
      "status": "PENDING",
      "dueDate": "2026-05-25",
      "categoryName": "string",
      "responsible": {
        "id": "string",
        "displayName": "string"
      },
      "splits": [
        {
          "id": "string",
          "userId": "string",
          "userName": "string",
          "status": "PENDING",
          "amount": 0
        }
      ]
    }
  ]
  ```

- `400 Bad Request` – Requisição inválida, como combinação inválida de filtros. 

  ```json
  {
    "message": "string"
  }
  ```

- `401 Unauthorized` – Usuário não autenticado. 

  ```json
  {
    "message": "string"
  }
  ```

- `500 Internal Server Error` – Erro interno do servidor. 

  ```json
  {
    "message": "string"
  }
  ```

---

### POST `/expenses`

Registrar nova despesa. 

#### URL

```http
POST https://home-finance-api-dwmz.onrender.com/expenses
```

#### Parâmetros

- Query: nenhum.   
- Path: nenhum.   
- Body: `CreateExpenseRequestBody` (campos como `title`, `description`, `amount`, `dueDate`, `categoryId`, splits, etc., conforme schema). 

#### Respostas

- `201 Created` ou `200 OK` – Despesa criada com sucesso (`ExpenseDTO`).   
- `400`, `401`, `500` – erros com corpo `DefaultErrorResponse` (`{ "message": "string" }`). 

---

### PATCH `/expenses/{id}/status`

Atualizar status de despesa. 

#### URL

```http
PATCH https://home-finance-api-dwmz.onrender.com/expenses/{id}/status
```

#### Parâmetros

- Path:
  - `id` (string): identificador da despesa. 
- Body: `UpdateExpenseStatusRequest` (provavelmente contém novo status, ex.: `{"status": "PAID"}`). 

#### Respostas

- `200 OK` – Status atualizado com sucesso (`ExpenseDTO` atualizado).   

---

### PATCH `/expenses/split/{id}/status`

Atualizar status de divisão de despesa. 

#### URL

```http
PATCH https://home-finance-api-dwmz.onrender.com/expenses/split/{id}/status
```

#### Parâmetros

- Path:
  - `id` (string): identificador da divisão. 
- Body: `UpdateExpenseSplitStausRequest` (novo status da parte da despesa). 

#### Respostas

- `200 OK` – Status da divisão atualizado com sucesso.   

---

### GET `/expenses/{id}`

Obter despesa por ID. 

#### URL

```http
GET https://home-finance-api-dwmz.onrender.com/expenses/{id}
```

#### Parâmetros

- Path:
  - `id` (string): identificador da despesa. 

#### Respostas

- `200 OK` – Retorna `ExpenseDTO`.   
- `404` – Despesa não encontrada. 

---

### DELETE `/expenses/{id}`

Deletar despesa por ID. 

#### URL

```http
DELETE https://home-finance-api-dwmz.onrender.com/expenses/{id}
```

#### Parâmetros

- Path:
  - `id` (string): identificador da despesa. 

#### Respostas

- `200 OK` – Despesa deletada com sucesso (`DeleteExpenseResponse`).   

---

### GET `/expenses/categories`

Obter categorias de despesas. 

#### URL

```http
GET https://home-finance-api-dwmz.onrender.com/expenses/categories
```

#### Parâmetros

- Nenhum. 

#### Respostas

- `200 OK` – Lista de categorias disponíveis. 

---

## Admin

Endpoints relacionados à administração do sistema (API), não aos administradores das casas. 

### POST `/admin/auth/register/new-admin`

Registrar novo administrador. 

#### URL

```http
POST https://home-finance-api-dwmz.onrender.com/admin/auth/register/new-admin
```

#### Parâmetros

- Body: `RegisterUserDTO` ou DTO específico de admin. 

#### Respostas

- `201 Created` – Admin criado com sucesso.   

---

### GET `/admin/user`

Obter usuário por ID. 

#### URL

```http
GET https://home-finance-api-dwmz.onrender.com/admin/user
```

#### Parâmetros

- Provavelmente query param `id` (conforme schema `AllUsersRequestResponse`/`SupabaseUser`). 

#### Respostas

- `200 OK` – Usuário retornado (`SupabaseUser` ou DTO próprio). 

---

### GET `/admin/user/all`

Obter todos os usuários. 

#### URL

```http
GET https://home-finance-api-dwmz.onrender.com/admin/user/all
```

#### Parâmetros

- Nenhum. 

#### Respostas

- `200 OK` – Lista de usuários (`AllUsersRequestResponse`). 

---

## Usuário

Rotas relacionadas a dados do usuário. 

### PATCH `/user/biometric/status`

Ativar/Desativar biometria. 

#### URL

```http
PATCH https://home-finance-api-dwmz.onrender.com/user/biometric/status
```

#### Parâmetros

- Body: provavelmente um campo booleano indicando ativar/desativar (`UpdateUserBiometricResponse` para resposta). 

#### Respostas

- `200 OK` – Status de biometria atualizado. 

---

### GET `/user/me`

Dados do usuário logado. 

#### URL

```http
GET https://home-finance-api-dwmz.onrender.com/user/me
```

#### Parâmetros

- Nenhum. 

#### Respostas

- `200 OK` – Dados do usuário autenticado (`EssentialUserWithBiometricInfoDTO` ou similar). 

---

## Autenticação

Rotas de autenticação e registro de usuários comuns. 

### POST `/public/auth/register`

Registrar novo usuário. 

#### URL

```http
POST https://home-finance-api-dwmz.onrender.com/public/auth/register
```

#### Parâmetros

- Body: `RegisterUserDTO` (nome, email, senha, etc.). 

#### Respostas

- `201 Created` – Usuário registrado com sucesso (`SupabaseAuthResponse` ou similar).   

---

### POST `/public/auth/login`

Login de usuário. 

#### URL

```http
POST https://home-finance-api-dwmz.onrender.com/public/auth/login
```

#### Parâmetros

- Body: `LoginDTO` (email, senha). 

#### Respostas

- `200 OK` – Login bem-sucedido (`SupabaseAuthResponse`, com tokens, usuário, etc.).   

---

## Health Check

### GET `/public/health`

Health Check Endpoint. 

#### URL

```http
GET https://home-finance-api-dwmz.onrender.com/public/health
```

#### Parâmetros

- Nenhum. 

#### Respostas

- `200 OK` – API saudável (geralmente algo simples como `{ "status": "UP" }`). 

---

## Schemas (referência rápida)

A documentação define os seguintes schemas usados nas requisições e respostas: 

- `RegisterUserDTO`, `LoginDTO`, `DefaultErrorResponse`  
- `SupabaseUser`, `SupabaseAuthResponse` e metadados (`SupabaseAppMetadata`, `SupabaseIdentity`, `SupabaseIdentityData`, `SupabaseUserMetadata`)  
- `HouseDTO`, `HouseMemberDTO`, `CreateHouseRequestBody`  
- `CreateExpenseRequestBody`, `ExpenseDTO`, `ExpenseSplitDTO`, `ResponsibleDTO`  
- `UpdateUserBiometricResponse`, `UpdateHouseBalanceResponse`  
- `UpdateExpenseStatusRequest`, `UpdateExpenseSplitStausRequest`  
- `CategoryExpenseReportData`, `ExpensesReportResponse`, `MonthExpensesReportData`, `MonthExpensesResume`  
- `ExpenseResume`, `HouseResumeDTO`, `MonthPaidExpensesResume`, `PendingExpensesResume`, `UserDebitsResume`  
- `CategoryEssentialUserDTO`, `EssentialUserWithBiometricInfoDTO`, `AllUsersRequestResponse`, `LeaveHouseResponse`, `DeleteExpenseResponse`  

Para detalhes exatos de cada campo, consulte a seção “Schemas” no Swagger. 