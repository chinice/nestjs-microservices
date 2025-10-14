import { ProductService } from './product.service';
export declare class ProductController {
    private productService;
    constructor(productService: ProductService);
    all(): Promise<import("./product.entity").Product[]>;
    create(title: string, image: string): Promise<import("./product.entity").Product>;
    get(id: number): Promise<import("./product.entity").Product>;
}
