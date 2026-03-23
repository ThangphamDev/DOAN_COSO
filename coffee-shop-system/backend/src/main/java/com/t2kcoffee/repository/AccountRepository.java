package com.t2kcoffee.repository;

import com.t2kcoffee.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Integer> {
    @Query("SELECT a FROM Account a WHERE a.userName = :username")
    Optional<Account> findByUserName(@Param("username") String username);
}
