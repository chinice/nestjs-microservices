import {Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";

export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({ default: 0 })
    status: number;

    @Column({ default: false })
    isEmailVerified: boolean;

    @Column({ nullable: true })
    emailVerificationToken: null | string;

    @Column({ nullable: true })
    resetPasswordToken: null | string;

    @Column({ nullable: true })
    resetPasswordExpires: Date | null;

    @Column({ nullable: true })
    refreshToken: string | null; // new column

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
