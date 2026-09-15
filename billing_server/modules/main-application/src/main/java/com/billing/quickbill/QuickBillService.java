package com.billing.quickbill;

import com.billing.data.AppUser;
import com.billing.incentive.IncentiveService;
import com.billing.incentive.dto.IncentiveProgress;
import com.billing.incentive.dto.IncentiveReportData;
import com.billing.quickbill.dto.QuickBillAccountRow;
import com.billing.quickbill.dto.QuickBillAccountsData;
import com.billing.quickbill.dto.QuickBillCancelRequest;
import com.billing.quickbill.dto.QuickBillDayRow;
import com.billing.quickbill.dto.QuickBillLogRow;
import com.billing.quickbill.dto.QuickBillReportData;
import com.billing.quickbill.dto.QuickBillRow;
import com.billing.quickbill.dto.QuickBillSaveRequest;
import com.billing.quickbill.dto.QuickBillTrendData;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class QuickBillService {

    private static final Set<String> PAY_MODES = Set.of("cash", "gpay");

    private final JdbcTemplate jdbcTemplate;
    private final IncentiveService incentiveService;

    @PostConstruct
    public void ensureTable() {
        jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS quick_bills (" +
                        "id INT UNSIGNED NOT NULL AUTO_INCREMENT," +
                        "amount DECIMAL(12,2) NOT NULL," +
                        "pay_mode VARCHAR(20) NOT NULL," +
                        "notes TEXT," +
                        "shop_id VARCHAR(255) DEFAULT NULL," +
                        "uid INT DEFAULT NULL," +
                        "bill_date DATE DEFAULT NULL," +
                        "bill_time TIME DEFAULT NULL," +
                        "is_cancelled INT DEFAULT 0," +
                        "PRIMARY KEY (id)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
        addColumnIfMissing("quick_bills", "is_cancelled", "INT DEFAULT 0");
        addColumnIfMissing("quick_bills", "tips_amount", "DECIMAL(12,2) DEFAULT 0");
        addColumnIfMissing("quick_bills", "tips_pay_mode", "VARCHAR(20) DEFAULT NULL");
        jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS quick_bill_logs (" +
                        "id INT UNSIGNED NOT NULL AUTO_INCREMENT," +
                        "bill_id INT NOT NULL," +
                        "action VARCHAR(20) NOT NULL," +
                        "old_amount DECIMAL(12,2) DEFAULT NULL," +
                        "new_amount DECIMAL(12,2) DEFAULT NULL," +
                        "old_pay_mode VARCHAR(20) DEFAULT NULL," +
                        "new_pay_mode VARCHAR(20) DEFAULT NULL," +
                        "old_notes TEXT," +
                        "new_notes TEXT," +
                        "reason TEXT," +
                        "uid INT DEFAULT NULL," +
                        "shop_id VARCHAR(255) DEFAULT NULL," +
                        "log_date DATE DEFAULT NULL," +
                        "log_time TIME DEFAULT NULL," +
                        "PRIMARY KEY (id)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
    }

    private void addColumnIfMissing(String table, String column, String definition) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                Integer.class,
                table,
                column
        );
        if (count == null || count == 0) {
            jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN " + column + " " + definition);
        }
    }

    @Transactional
    public Map<String, Object> save(QuickBillSaveRequest request, AppUser user) {
        if (request == null || request.getAmount() == null || request.getAmount() <= 0) {
            throw new RuntimeException("Enter a valid amount");
        }
        String payMode = request.getPayMode() == null ? "" : request.getPayMode().trim().toLowerCase();
        if (!PAY_MODES.contains(payMode)) {
            throw new RuntimeException("Select Cash or GPay");
        }
        String notes = request.getNotes() == null ? "" : request.getNotes().trim();
        double tipsAmount = normalizeTipsAmount(request.getTipsAmount());
        String tipsPayMode = normalizeTipsPayMode(request.getTipsPayMode(), tipsAmount);
        String shopId = user == null ? "" : user.shopId();
        Long uid = user == null ? null : user.getId();

        KeyHolder keys = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO quick_bills (amount, pay_mode, tips_amount, tips_pay_mode, notes, shop_id, uid, bill_date, bill_time) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), CURTIME())",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setDouble(1, request.getAmount());
            ps.setString(2, payMode);
            ps.setDouble(3, tipsAmount);
            if (tipsPayMode.isEmpty()) {
                ps.setNull(4, java.sql.Types.VARCHAR);
            } else {
                ps.setString(4, tipsPayMode);
            }
            ps.setString(5, notes);
            if (shopId == null || shopId.isBlank()) {
                ps.setNull(6, java.sql.Types.VARCHAR);
            } else {
                ps.setString(6, shopId);
            }
            if (uid == null) {
                ps.setNull(7, java.sql.Types.INTEGER);
            } else {
                ps.setLong(7, uid);
            }
            return ps;
        }, keys);
        Number key = keys.getKey();
        return Map.of("id", key == null ? 0 : key.longValue());
    }

    public QuickBillReportData today(AppUser user) {
        if (user == null || user.getId() == null) {
            throw new RuntimeException("Not signed in");
        }
        String shopId = user.shopId();
        if (shopId == null || shopId.isBlank()) {
            throw new RuntimeException("Shop ID is missing from session");
        }
        QuickBillReportData data = query(
                " WHERE qb.uid = ? AND qb.shop_id = ? AND qb.bill_date = CURDATE()" +
                        " AND IFNULL(qb.is_cancelled,0) = 0 ORDER BY qb.bill_time DESC, qb.id DESC",
                user.getId(),
                shopId
        );
        String today = LocalDate.now().toString();
        data.setExpenseTotal(round2(sumExpenses(user.getId(), shopId, today, today)));
        return data;
    }

    @Transactional
    public void update(Long id, QuickBillSaveRequest request, AppUser user) {
        QuickBillRow current = requireActiveBill(id);
        String payMode = request == null || request.getPayMode() == null ? "" : request.getPayMode().trim().toLowerCase();
        if (request == null || request.getAmount() == null || request.getAmount() <= 0) {
            throw new RuntimeException("Enter a valid amount");
        }
        if (!PAY_MODES.contains(payMode)) {
            throw new RuntimeException("Select Cash or GPay");
        }
        String notes = request.getNotes() == null ? "" : request.getNotes().trim();
        double tipsAmount = normalizeTipsAmount(request.getTipsAmount());
        String tipsPayMode = normalizeTipsPayMode(request.getTipsPayMode(), tipsAmount);
        jdbcTemplate.update(
                "UPDATE quick_bills SET amount = ?, pay_mode = ?, tips_amount = ?, tips_pay_mode = ?, notes = ? WHERE id = ?",
                request.getAmount(), payMode, tipsAmount, tipsPayMode.isEmpty() ? null : tipsPayMode, notes, id
        );
        insertLog(id, "edit", current, request.getAmount(), payMode, notes, "", user);
    }

    @Transactional
    public void cancel(Long id, QuickBillCancelRequest request, AppUser user) {
        QuickBillRow current = requireActiveBill(id);
        String reason = request == null || request.getReason() == null ? "" : request.getReason().trim();
        if (reason.isEmpty()) {
            throw new RuntimeException("Enter a cancel reason");
        }
        int updated = jdbcTemplate.update("UPDATE quick_bills SET is_cancelled = 1 WHERE id = ? AND IFNULL(is_cancelled,0) = 0", id);
        if (updated == 0) {
            throw new RuntimeException("Bill already cancelled");
        }
        insertLog(id, "cancel", current, current.getAmount(), current.getPayMode(), current.getNotes(), reason, user);
    }

    public List<QuickBillLogRow> logs(String from, String to) {
        if (from == null || from.isBlank() || to == null || to.isBlank()) {
            throw new RuntimeException("From date and to date are required");
        }
        return jdbcTemplate.query(
                "SELECT l.id, l.bill_id AS billId, l.action, l.old_amount AS oldAmount, l.new_amount AS newAmount, " +
                        "l.old_pay_mode AS oldPayMode, l.new_pay_mode AS newPayMode, " +
                        "IFNULL(l.old_notes,'') AS oldNotes, IFNULL(l.new_notes,'') AS newNotes, IFNULL(l.reason,'') AS reason, " +
                        "IFNULL(NULLIF(u.fullName,''), u.user_name) AS userName, " +
                        "IFNULL(o.shop_name, l.shop_id) AS shopName, " +
                        "DATE_FORMAT(l.log_date, '%d-%m-%Y') AS logDate, TIME_FORMAT(l.log_time, '%h:%i %p') AS logTime " +
                        "FROM quick_bill_logs l " +
                        "LEFT JOIN users u ON u.id = l.uid " +
                        "LEFT JOIN outlets o ON o.shop_id = l.shop_id " +
                        "WHERE l.log_date BETWEEN ? AND ? ORDER BY l.id DESC",
                (rs, i) -> {
                    QuickBillLogRow row = new QuickBillLogRow();
                    row.setId(rs.getLong("id"));
                    row.setBillId(rs.getLong("billId"));
                    row.setAction(rs.getString("action"));
                    row.setOldAmount(rs.getDouble("oldAmount"));
                    row.setNewAmount(rs.getDouble("newAmount"));
                    row.setOldPayMode(rs.getString("oldPayMode"));
                    row.setNewPayMode(rs.getString("newPayMode"));
                    row.setOldNotes(rs.getString("oldNotes"));
                    row.setNewNotes(rs.getString("newNotes"));
                    row.setReason(rs.getString("reason"));
                    row.setUserName(rs.getString("userName"));
                    row.setShopName(rs.getString("shopName"));
                    row.setLogDate(rs.getString("logDate"));
                    row.setLogTime(rs.getString("logTime"));
                    return row;
                },
                from,
                to
        );
    }

    private QuickBillRow requireActiveBill(Long id) {
        List<QuickBillRow> rows = jdbcTemplate.query(
                SELECT_ROWS + " WHERE qb.id = ?",
                (rs, i) -> mapRow(rs),
                id
        );
        if (rows.isEmpty()) {
            throw new RuntimeException("Bill not found");
        }
        QuickBillRow row = rows.get(0);
        if (row.getIsCancelled() != null && row.getIsCancelled() == 1) {
            throw new RuntimeException("Cancelled bills cannot be changed");
        }
        return row;
    }

    private void insertLog(
            Long billId,
            String action,
            QuickBillRow current,
            Double newAmount,
            String newPayMode,
            String newNotes,
            String reason,
            AppUser user
    ) {
        jdbcTemplate.update(
                "INSERT INTO quick_bill_logs (bill_id, action, old_amount, new_amount, old_pay_mode, new_pay_mode, " +
                        "old_notes, new_notes, reason, uid, shop_id, log_date, log_time) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), CURTIME())",
                billId,
                action,
                current.getAmount(),
                newAmount,
                current.getPayMode(),
                newPayMode,
                current.getNotes(),
                newNotes,
                reason,
                user == null ? null : user.getId(),
                user == null ? null : user.shopId()
        );
    }

    public QuickBillTrendData myTrend(AppUser user, int days) {
        if (user == null || user.getId() == null) {
            throw new RuntimeException("Not signed in");
        }
        String shopId = user.shopId();
        if (shopId == null || shopId.isBlank()) {
            throw new RuntimeException("Shop ID is missing from session");
        }
        return trend(days, user.getId(), shopId);
    }

    public QuickBillTrendData trend(int days, Long userId, String shopId) {
        int span = days <= 0 ? 10 : Math.min(days, 31);
        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(span - 1L);
        return trend(from.toString(), to.toString(), userId, shopId);
    }

    public QuickBillTrendData trend(String from, String to, Long userId, String shopId) {
        LocalDate fromDate;
        LocalDate toDate;
        try {
            fromDate = LocalDate.parse(from);
            toDate = LocalDate.parse(to);
        } catch (Exception ex) {
            throw new RuntimeException("From date and to date are required");
        }
        if (toDate.isBefore(fromDate)) {
            throw new RuntimeException("To date cannot be before from date");
        }

        StringBuilder sql = new StringBuilder(
                "SELECT qb.bill_date AS day, " +
                        "SUM(CASE WHEN qb.pay_mode = 'gpay' THEN qb.amount ELSE 0 END) AS gpay, " +
                        "SUM(CASE WHEN qb.pay_mode = 'gpay' THEN 0 ELSE qb.amount END) AS cash, " +
                        "SUM(qb.amount) AS total, COUNT(*) AS billCount " +
                        "FROM quick_bills qb " +
                        "WHERE qb.bill_date BETWEEN ? AND ? AND IFNULL(qb.is_cancelled,0) = 0"
        );
        List<Object> args = new ArrayList<>();
        args.add(fromDate.toString());
        args.add(toDate.toString());
        if (userId != null && userId > 0) {
            sql.append(" AND qb.uid = ?");
            args.add(userId);
        }
        if (shopId != null && !shopId.isBlank()) {
            sql.append(" AND qb.shop_id = ?");
            args.add(shopId);
        }
        sql.append(" GROUP BY qb.bill_date");

        Map<LocalDate, QuickBillDayRow> byDay = new HashMap<>();
        jdbcTemplate.query(sql.toString(), (rs, i) -> {
            LocalDate day = rs.getDate("day").toLocalDate();
            QuickBillDayRow row = new QuickBillDayRow();
            row.setCash(rs.getDouble("cash"));
            row.setGpay(rs.getDouble("gpay"));
            row.setTotal(rs.getDouble("total"));
            row.setCount(rs.getInt("billCount"));
            byDay.put(day, row);
            return row;
        }, args.toArray());

        DateTimeFormatter labelFmt = DateTimeFormatter.ofPattern("dd MMM", Locale.ENGLISH);
        DateTimeFormatter weekFmt = DateTimeFormatter.ofPattern("EEE", Locale.ENGLISH);
        LocalDate today = LocalDate.now();
        List<QuickBillDayRow> days = new ArrayList<>();
        double cashTotal = 0;
        double gpayTotal = 0;
        double grandTotal = 0;
        int count = 0;
        for (LocalDate d = fromDate; !d.isAfter(toDate); d = d.plusDays(1)) {
            QuickBillDayRow row = byDay.get(d);
            if (row == null) {
                row = new QuickBillDayRow();
                row.setCash(0.0);
                row.setGpay(0.0);
                row.setTotal(0.0);
                row.setCount(0);
            }
            row.setDate(d.toString());
            row.setLabel(d.format(labelFmt));
            row.setWeekday(d.format(weekFmt));
            row.setToday(d.equals(today));
            days.add(row);
            cashTotal += row.getCash() == null ? 0 : row.getCash();
            gpayTotal += row.getGpay() == null ? 0 : row.getGpay();
            grandTotal += row.getTotal() == null ? 0 : row.getTotal();
            count += row.getCount() == null ? 0 : row.getCount();
        }

        QuickBillTrendData data = new QuickBillTrendData();
        data.setDays(days);
        data.setCashTotal(cashTotal);
        data.setGpayTotal(gpayTotal);
        data.setGrandTotal(grandTotal);
        data.setCount(count);
        return data;
    }

    public QuickBillReportData report(String from, String to, Long userId, String shopId) {
        if (from == null || from.isBlank() || to == null || to.isBlank()) {
            throw new RuntimeException("From date and to date are required");
        }
        StringBuilder sql = new StringBuilder(" WHERE qb.bill_date BETWEEN ? AND ?");
        List<Object> args = new ArrayList<>();
        args.add(from);
        args.add(to);
        if (userId != null && userId > 0) {
            sql.append(" AND qb.uid = ?");
            args.add(userId);
        }
        if (shopId != null && !shopId.isBlank()) {
            sql.append(" AND qb.shop_id = ?");
            args.add(shopId);
        }
        sql.append(" ORDER BY qb.bill_date, qb.bill_time, qb.id");
        QuickBillReportData data = query(sql.toString(), args.toArray());
        data.setExpenseTotal(round2(sumExpenses(userId, shopId, from, to)));
        return data;
    }

    public QuickBillAccountsData todayAccounts(AppUser user) {
        if (user == null || user.getId() == null) {
            throw new RuntimeException("Not signed in");
        }
        String shopId = user.shopId();
        if (shopId == null || shopId.isBlank()) {
            throw new RuntimeException("Shop ID is missing from session");
        }
        String today = LocalDate.now().toString();
        return accounts(today, today, shopId);
    }

    public QuickBillAccountsData accounts(String from, String to, String shopId) {
        if (from == null || from.isBlank() || to == null || to.isBlank()) {
            throw new RuntimeException("From date and to date are required");
        }
        if (shopId == null || shopId.isBlank()) {
            throw new RuntimeException("Shop is required");
        }

        List<QuickBillAccountRow> people = jdbcTemplate.query(
                "SELECT u.id AS userId, IFNULL(NULLIF(u.fullName,''), u.user_name) AS userName, " +
                        "u.shop_id AS shopId, IFNULL(o.shop_name, u.shop_id) AS shopName " +
                        "FROM users u LEFT JOIN outlets o ON o.shop_id = u.shop_id " +
                        "WHERE u.is_active = 1 AND u.shop_id = ? ORDER BY userName, u.user_name",
                (rs, i) -> {
                    QuickBillAccountRow row = new QuickBillAccountRow();
                    row.setUserId(rs.getLong("userId"));
                    row.setUserName(rs.getString("userName"));
                    row.setShopId(rs.getString("shopId"));
                    row.setShopName(rs.getString("shopName"));
                    return row;
                },
                shopId
        );

        Map<Long, double[]> collected = new HashMap<>();
        jdbcTemplate.query(
                "SELECT qb.uid AS userId, " +
                        "SUM(CASE WHEN qb.pay_mode = 'gpay' THEN qb.amount ELSE 0 END) AS bank, " +
                        "SUM(CASE WHEN qb.pay_mode = 'gpay' THEN 0 ELSE qb.amount END) AS cash, " +
                        "SUM(IFNULL(qb.tips_amount,0)) AS tips, " +
                        "SUM(CASE WHEN qb.tips_pay_mode = 'cash' THEN IFNULL(qb.tips_amount,0) ELSE 0 END) AS tipsCash, " +
                        "SUM(CASE WHEN qb.tips_pay_mode = 'gpay' THEN IFNULL(qb.tips_amount,0) ELSE 0 END) AS tipsBank " +
                        "FROM quick_bills qb " +
                        "WHERE qb.shop_id = ? AND qb.bill_date BETWEEN ? AND ? AND IFNULL(qb.is_cancelled,0) = 0 " +
                        "GROUP BY qb.uid",
                rs -> {
                    collected.put(rs.getLong("userId"), new double[]{
                            rs.getDouble("cash"),
                            rs.getDouble("bank"),
                            rs.getDouble("tips"),
                            rs.getDouble("tipsCash"),
                            rs.getDouble("tipsBank")
                    });
                },
                shopId,
                from,
                to
        );

        Map<Long, Double> incentiveByUser = new HashMap<>();
        IncentiveReportData incentives = incentiveService.report(from, to, shopId, null);
        for (IncentiveProgress person : incentives.getRows()) {
            if (person.getUserId() != null) {
                incentiveByUser.put(person.getUserId(), nz(person.getIncentiveEarn()));
            }
        }

        Map<Long, Double> expenseByUser = new HashMap<>();
        jdbcTemplate.query(
                "SELECT uid AS userId, IFNULL(SUM(amount),0) AS expense " +
                        "FROM salon_expenses WHERE shop_id = ? AND exp_date BETWEEN ? AND ? GROUP BY uid",
                rs -> {
                    expenseByUser.put(rs.getLong("userId"), rs.getDouble("expense"));
                },
                shopId,
                from,
                to
        );

        QuickBillAccountsData data = new QuickBillAccountsData();
        data.setShopId(shopId);
        if (!people.isEmpty()) {
            data.setShopName(people.get(0).getShopName());
        }
        double cashTotal = 0;
        double bankTotal = 0;
        double tipsTotal = 0;
        double incentiveTotal = 0;
        double expenseTotal = 0;
        double finalCashTotal = 0;
        double finalBankTotal = 0;
        for (QuickBillAccountRow row : people) {
            double[] vals = collected.getOrDefault(row.getUserId(), new double[]{0, 0, 0, 0, 0});
            double cash = vals[0];
            double bank = vals[1];
            double tips = vals[2];
            double tipsCash = vals[3];
            double tipsBank = vals[4];
            double incentive = incentiveByUser.getOrDefault(row.getUserId(), 0.0);
            double expense = expenseByUser.getOrDefault(row.getUserId(), 0.0);
            double finalCash = cash - tipsBank - incentive;
            row.setCashTotal(round2(cash));
            row.setBankTotal(round2(bank));
            row.setTotal(round2(cash + bank));
            row.setTipsTotal(round2(tipsBank));
            row.setTipsCash(round2(tipsCash));
            row.setTipsBank(round2(tipsBank));
            row.setIncentiveEarn(round2(incentive));
            row.setExpenseTotal(round2(expense));
            row.setFinalCash(round2(finalCash));
            row.setFinalBank(round2(bank));
            cashTotal += cash;
            bankTotal += bank;
            tipsTotal += tipsBank;
            incentiveTotal += incentive;
            expenseTotal += expense;
            finalCashTotal += finalCash;
            finalBankTotal += bank;
        }
        data.setRows(people);
        data.setCount(people.size());
        data.setCashTotal(round2(cashTotal));
        data.setBankTotal(round2(bankTotal));
        data.setGrandTotal(round2(cashTotal + bankTotal));
        data.setTipsTotal(round2(tipsTotal));
        data.setIncentiveTotal(round2(incentiveTotal));
        data.setExpenseTotal(round2(expenseTotal));
        data.setFinalCashTotal(round2(finalCashTotal));
        data.setFinalBankTotal(round2(finalBankTotal));
        return data;
    }

    private double sumExpenses(Long userId, String shopId, String from, String to) {
        StringBuilder sql = new StringBuilder(
                "SELECT IFNULL(SUM(amount),0) FROM salon_expenses WHERE exp_date BETWEEN ? AND ?"
        );
        List<Object> args = new ArrayList<>();
        args.add(from);
        args.add(to);
        if (userId != null && userId > 0) {
            sql.append(" AND uid = ?");
            args.add(userId);
        }
        if (shopId != null && !shopId.isBlank()) {
            sql.append(" AND shop_id = ?");
            args.add(shopId);
        }
        Double total = jdbcTemplate.queryForObject(sql.toString(), Double.class, args.toArray());
        return total == null ? 0 : total;
    }

    private static double nz(Double value) {
        return value == null ? 0 : value;
    }

    private static double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private static final String SELECT_ROWS =
            "SELECT qb.id, qb.amount, qb.pay_mode AS payMode, " +
                    "IFNULL(qb.tips_amount,0) AS tipsAmount, IFNULL(qb.tips_pay_mode,'') AS tipsPayMode, " +
                    "IFNULL(qb.notes,'') AS notes, " +
                    "qb.shop_id AS shopId, IFNULL(o.shop_name, qb.shop_id) AS shopName, " +
                    "qb.uid AS userId, IFNULL(NULLIF(u.fullName,''), u.user_name) AS userName, " +
                    "DATE_FORMAT(qb.bill_date, '%d-%m-%Y') AS billDate, " +
                    "TIME_FORMAT(qb.bill_time, '%h:%i %p') AS billTime, " +
                    "IFNULL(qb.is_cancelled,0) AS isCancelled " +
                    "FROM quick_bills qb " +
                    "LEFT JOIN users u ON u.id = qb.uid " +
                    "LEFT JOIN outlets o ON o.shop_id = qb.shop_id";

    private QuickBillReportData query(String where, Object... args) {
        List<QuickBillRow> rows = jdbcTemplate.query(SELECT_ROWS + where, (rs, i) -> mapRow(rs), args);
        QuickBillReportData data = new QuickBillReportData();
        data.setRows(rows);
        double cash = 0;
        double gpay = 0;
        double tips = 0;
        double total = 0;
        int active = 0;
        for (QuickBillRow row : rows) {
            if (row.getIsCancelled() != null && row.getIsCancelled() == 1) {
                continue;
            }
            active++;
            double amt = row.getAmount() == null ? 0 : row.getAmount();
            double tip = row.getTipsAmount() == null ? 0 : row.getTipsAmount();
            tips += tip;
            total += amt;
            if ("gpay".equalsIgnoreCase(row.getPayMode())) {
                gpay += amt;
            } else {
                cash += amt;
            }
        }
        data.setCount(active);
        data.setCashTotal(cash);
        data.setGpayTotal(gpay);
        data.setTipsTotal(tips);
        data.setGrandTotal(total);
        return data;
    }

    private QuickBillRow mapRow(ResultSet rs) throws SQLException {
        QuickBillRow row = new QuickBillRow();
        row.setId(rs.getLong("id"));
        row.setAmount(rs.getDouble("amount"));
        row.setPayMode(rs.getString("payMode"));
        row.setTipsAmount(rs.getDouble("tipsAmount"));
        row.setTipsPayMode(rs.getString("tipsPayMode"));
        row.setNotes(rs.getString("notes"));
        row.setShopId(rs.getString("shopId"));
        row.setShopName(rs.getString("shopName"));
        long userId = rs.getLong("userId");
        row.setUserId(rs.wasNull() ? null : userId);
        row.setUserName(rs.getString("userName"));
        row.setBillDate(rs.getString("billDate"));
        row.setBillTime(rs.getString("billTime"));
        row.setIsCancelled(rs.getInt("isCancelled"));
        return row;
    }

    private double normalizeTipsAmount(Double tips) {
        if (tips == null) {
            return 0;
        }
        if (tips < 0) {
            throw new RuntimeException("Enter a valid tips amount");
        }
        return tips;
    }

    private String normalizeTipsPayMode(String payMode, double tipsAmount) {
        String mode = payMode == null ? "" : payMode.trim().toLowerCase();
        if (tipsAmount <= 0) {
            return "";
        }
        if (!PAY_MODES.contains(mode)) {
            throw new RuntimeException("Select Cash or GPay for tips");
        }
        return mode;
    }
}
