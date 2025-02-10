# NestJS Project

## Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (LTS version recommended)
- [Yarn](https://yarnpkg.com/) or npm
- [NestJS CLI](https://docs.nestjs.com/cli) (optional, but recommended)

__Recommended to use NPM__

### Installation

1. **Clone the repository**
   ```sh
   git clone https://github.com/Edufund-Osp/EdufundBE.git
   cd backend
   ```

2. **Install dependencies**
   ```sh
   yarn install
   # or
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Configure necessary variables in `.env`

### Running the Application

#### Development Mode
```sh
yarn start:dev
# or
npm run start:dev
```

#### Production Mode
```sh
yarn build && yarn start
# or
npm run build && npm run start
```

#### Running with Watch Mode (Hot Reloading)
```sh
yarn start:watch
# or
npm run start:watch
```

### Running Tests

#### Unit Tests
```sh
yarn test
# or
npm run test
```

#### End-to-End (E2E) Tests
```sh
yarn test:e2e
# or
npm run test:e2e
```

#### Linting
```sh
yarn lint
# or
npm run lint
```

### API Documentation (Swagger)
Once the server is running, visit:
```
http://localhost:3000/api
```

### License
This project is licensed under the [MIT License](LICENSE).
