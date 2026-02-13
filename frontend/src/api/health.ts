import axios from 'axios';
import type { AxiosInstance } from 'axios';

interface ApiResponse<T> {
    data: T;
    status: number;
    message: string;
}

class HealthApi {
    private client: AxiosInstance;
    
    constructor(baseURL: string = 'http://localhost:3000/api') {
        this.client = axios.create({
            baseURL,
            timeout: 10000,
        });
    }

    async getHealth(): Promise<ApiResponse<{ status: string }>> {
        try {
            const response = await this.client.get('/health');
            return response.data;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    private handleError(error: unknown): void {
        if (axios.isAxiosError(error)) {
            console.error('API Error:', error.message);
        } else {
            console.error('Unexpected error:', error);
        }
    }
}

export default new HealthApi();