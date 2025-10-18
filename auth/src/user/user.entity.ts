import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";

@Entity()
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

    @Column({ type: 'varchar', nullable: true })
    emailVerificationToken?: string | null;

    @Column({ type: 'varchar', nullable: true })
    resetPasswordToken?: string | null;

    @Column({ type: 'timestamptz', nullable: true })
    resetPasswordExpires?: Date | null;

    @Column({ type: 'varchar', nullable: true })
    refreshToken?: string | null; // new column

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
