package main.java.com.t2kcoffee.repository;

import com.t2kcoffee.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountRepository extends JpaRepository<Account, Integer> {
}
