import { app } from './app';
import { PORT } from './constants';

const port = PORT;
const host = '0.0.0.0';

app.listen(port, host, () => {
	console.log(`The server is accepting connections from ${host}:${port}!\n`);
});
