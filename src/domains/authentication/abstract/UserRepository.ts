import Maybe from '@abstract/Maybe';
import User from '../User';

export interface UserRepository {
    persistUser(user: User): Promise<User>
    getUserByEmail(id: string): Promise<Maybe<User, Error>>
}
