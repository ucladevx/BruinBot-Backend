import { app } from './src/app';
import { PORT } from './src/constants';

const port = PORT;
const host = '0.0.0.0';

app.listen(port, host, () => {
	console.log(`The server is accepting connections from ${host}:${port}!\n`);
});
