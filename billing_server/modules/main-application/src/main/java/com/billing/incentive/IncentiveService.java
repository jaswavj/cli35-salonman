package com.billing.incentive;

import com.billing.data.AppUser;
import com.billing.incentive.dto.IncentiveProgress;
import com.billing.incentive.dto.IncentiveReportData;
import com.billing.incentive.dto.IncentiveRow;
import com.billing.incentive.dto.IncentiveSaveRequest;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class IncentiveService {

    private static final Set<String> COMPARE = Set.of("lt", "gt");
    private static final Set<String> MODES = Set.of("amount", "percent");

    private static final String SELECT =
            "SELECT i.id, i.shop_id AS shopId, IFNULL(o.shop_name, i.shop_id) AS shopName, " +
                    "i.uid AS userId, IFNULL(NULLIF(u.fullName,''), u.user_name) AS userName, " +
                    "i.target_amount AS targetAmount, i.compare_type AS compareType, " +
                    "i.incentive_mode AS incentiveMode, i.incentive_value AS incentiveValue " +
                    "FROM incentives i " +
                    "LEFT JOIN users u ON u.id = i.uid " +
                    "LEFT JOIN outlets o ON o.shop_id = i.shop_id";

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void ensureTable() {
        jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS incentives (" +
                        "id INT UNSIGNED NOT NULL AUTO_INCREMENT," +
                        "shop_id VARCHAR(255) NOT NULL," +
                        "uid INT NOT NULL," +
                        "target_amount DECIMAL(12,2) NOT NULL," +
                        "compare_type VARCHAR(20) NOT NULL," +
                        "incentive_mode VARCHAR(20) NOT NULL," +
                        "incentive_value DECIMAL(12,2) NOT NULL," +
                        "PRIMARY KEY (id)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
        dropUniqueIfPresent();
    }

    private void dropUniqueIfPresent() {
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.STATISTICS " +
                            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'incentives' AND INDEX_NAME = 'uk_incentive_user_shop'",
                    Integer.class
            );
            if (count != null && count > 0) {
                jdbcTemplate.execute("ALTER TABLE incentives DROP INDEX uk_incentive_user_shop");
            }
        } catch (RuntimeException ignored) {
            // older databases may already allow multiple conditions
        }
    }

    public List<IncentiveRow> listByUser(String shopId, Long userId) {
        if (shopId == null || shopId.isBlank() || userId == null || userId <= 0) {
            throw new RuntimeException("Select shop and user");
        }
        return jdbcTemplate.query(
                SELECT + " WHERE i.shop_id = ? AND i.uid = ? ORDER BY i.target_amount, i.id",
                (rs, i) -> mapRow(rs),
                shopId,
                userId
        );
    }

    public List<IncentiveRow> listByShop(String shopId) {
        if (shopId == null || shopId.isBlank()) {
            throw new RuntimeException("Select shop");
        }
        return jdbcTemplate.query(
                "SELECT i.id, u.shop_id AS shopId, IFNULL(o.shop_name, u.shop_id) AS shopName, " +
                        "u.id AS userId, IFNULL(NULLIF(u.fullName,''), u.user_name) AS userName, " +
                        "i.target_amount AS targetAmount, i.compare_type AS compareType, " +
                        "i.incentive_mode AS incentiveMode, i.incentive_value AS incentiveValue " +
                        "FROM users u " +
                        "LEFT JOIN incentives i ON i.uid = u.id AND i.shop_id = u.shop_id " +
                        "LEFT JOIN outlets o ON o.shop_id = u.shop_id " +
                        "WHERE u.is_active = 1 AND u.shop_id = ? " +
                        "ORDER BY userName, u.user_name, i.target_amount, i.id",
                (rs, i) -> mapRow(rs),
                shopId
        );
    }

    @Transactional
    public Map<String, Object> save(IncentiveSaveRequest request) {
        ValidatedIncentive data = validate(request);
        if (request.getId() != null && request.getId() > 0) {
            int updated = jdbcTemplate.update(
                    "UPDATE incentives SET target_amount = ?, compare_type = ?, incentive_mode = ?, incentive_value = ? " +
                            "WHERE id = ? AND uid = ? AND shop_id = ?",
                    data.targetAmount,
                    data.compare,
                    data.mode,
                    data.incentiveValue,
                    request.getId(),
                    data.userId,
                    data.shopId
            );
            if (updated == 0) {
                throw new RuntimeException("Incentive not found");
            }
            return Map.of("id", request.getId());
        }
        jdbcTemplate.update(
                "INSERT INTO incentives (shop_id, uid, target_amount, compare_type, incentive_mode, incentive_value) " +
                        "VALUES (?, ?, ?, ?, ?, ?)",
                data.shopId,
                data.userId,
                data.targetAmount,
                data.compare,
                data.mode,
                data.incentiveValue
        );
        return Map.of("saved", true);
    }

    @Transactional
    public void delete(Long id) {
        if (id == null || id <= 0) {
            throw new RuntimeException("Incentive not found");
        }
        int updated = jdbcTemplate.update("DELETE FROM incentives WHERE id = ?", id);
        if (updated == 0) {
            throw new RuntimeException("Incentive not found");
        }
    }

    public IncentiveProgress today(AppUser user) {
        if (user == null || user.getId() == null) {
            throw new RuntimeException("Not signed in");
        }
        String shopId = user.shopId();
        if (shopId == null || shopId.isBlank()) {
            throw new RuntimeException("Shop ID is missing from session");
        }
        return progressForUser(user.getId(), shopId, java.time.LocalDate.now().toString(), java.time.LocalDate.now().toString());
    }

    public IncentiveReportData report(String from, String to, String shopId, Long userId) {
        if (from == null || from.isBlank() || to == null || to.isBlank()) {
            throw new RuntimeException("From date and to date are required");
        }
        StringBuilder sql = new StringBuilder(
                "SELECT u.id AS userId, IFNULL(NULLIF(u.fullName,''), u.user_name) AS userName, " +
                        "u.shop_id AS shopId, IFNULL(o.shop_name, u.shop_id) AS shopName " +
                        "FROM users u LEFT JOIN outlets o ON o.shop_id = u.shop_id WHERE u.is_active = 1"
        );
        List<Object> args = new ArrayList<>();
        if (shopId != null && !shopId.isBlank()) {
            sql.append(" AND u.shop_id = ?");
            args.add(shopId);
        }
        if (userId != null && userId > 0) {
            sql.append(" AND u.id = ?");
            args.add(userId);
        }
        sql.append(" ORDER BY userName, u.user_name");
        List<IncentiveProgress> people = jdbcTemplate.query(sql.toString(), (rs, i) -> {
            IncentiveProgress row = new IncentiveProgress();
            row.setUserId(rs.getLong("userId"));
            row.setUserName(rs.getString("userName"));
            row.setShopId(rs.getString("shopId"));
            row.setShopName(rs.getString("shopName"));
            return row;
        }, args.toArray());

        IncentiveReportData data = new IncentiveReportData();
        double collectionTotal = 0;
        double incentiveTotal = 0;
        for (IncentiveProgress person : people) {
            IncentiveProgress done = applyProgress(
                    person,
                    collection(person.getUserId(), person.getShopId(), from, to),
                    listByUserSafe(person.getShopId(), person.getUserId())
            );
            data.getRows().add(done);
            collectionTotal += done.getCollection() == null ? 0 : done.getCollection();
            incentiveTotal += done.getIncentiveEarn() == null ? 0 : done.getIncentiveEarn();
        }
        data.setCount(data.getRows().size());
        data.setCollectionTotal(round2(collectionTotal));
        data.setIncentiveTotal(round2(incentiveTotal));
        return data;
    }

    private IncentiveProgress progressForUser(Long userId, String shopId, String from, String to) {
        IncentiveProgress row = new IncentiveProgress();
        row.setUserId(userId);
        row.setShopId(shopId);
        jdbcTemplate.query(
                "SELECT IFNULL(NULLIF(u.fullName,''), u.user_name) AS userName, IFNULL(o.shop_name, u.shop_id) AS shopName " +
                        "FROM users u LEFT JOIN outlets o ON o.shop_id = u.shop_id WHERE u.id = ?",
                rs -> {
                    if (rs.next()) {
                        row.setUserName(rs.getString("userName"));
                        row.setShopName(rs.getString("shopName"));
                    }
                    return null;
                },
                userId
        );
        return applyProgress(row, collection(userId, shopId, from, to), listByUserSafe(shopId, userId));
    }

    private List<IncentiveRow> listByUserSafe(String shopId, Long userId) {
        if (shopId == null || shopId.isBlank() || userId == null) {
            return List.of();
        }
        return listByUser(shopId, userId);
    }

    private double collection(Long userId, String shopId, String from, String to) {
        Double total = jdbcTemplate.queryForObject(
                "SELECT IFNULL(SUM(amount),0) FROM quick_bills " +
                        "WHERE uid = ? AND shop_id = ? AND bill_date BETWEEN ? AND ? AND IFNULL(is_cancelled,0) = 0",
                Double.class,
                userId,
                shopId,
                from,
                to
        );
        return total == null ? 0 : total;
    }

    private IncentiveProgress applyProgress(IncentiveProgress row, double collection, List<IncentiveRow> rules) {
        row.setCollection(round2(collection));
        row.setIncentiveEarn(0.0);
        row.setToNext(0.0);
        IncentiveRow best = null;
        double bestPay = -1;
        for (IncentiveRow rule : rules) {
            if (rule.getId() == null || !matches(collection, rule)) {
                continue;
            }
            double pay = payout(collection, rule);
            if (pay > bestPay) {
                bestPay = pay;
                best = rule;
            }
        }
        if (best != null) {
            row.setIncentiveEarn(round2(bestPay));
            row.setTarget(best.getTargetAmount());
        }
        Double next = null;
        for (IncentiveRow rule : rules) {
            if (rule.getId() == null || !"gt".equalsIgnoreCase(rule.getCompareType()) || rule.getTargetAmount() == null) {
                continue;
            }
            if (collection > rule.getTargetAmount()) {
                continue;
            }
            if (next == null || rule.getTargetAmount() < next) {
                next = rule.getTargetAmount();
            }
        }
        if (next != null) {
            row.setNextTarget(next);
            row.setToNext(round2(Math.max(0, next - collection)));
        }
        return row;
    }

    private boolean matches(double collection, IncentiveRow rule) {
        if (rule.getTargetAmount() == null) {
            return false;
        }
        if ("lt".equalsIgnoreCase(rule.getCompareType())) {
            return collection < rule.getTargetAmount();
        }
        if ("gt".equalsIgnoreCase(rule.getCompareType())) {
            return collection > rule.getTargetAmount();
        }
        return false;
    }

    private double payout(double collection, IncentiveRow rule) {
        double value = rule.getIncentiveValue() == null ? 0 : rule.getIncentiveValue();
        if ("percent".equalsIgnoreCase(rule.getIncentiveMode())) {
            return collection * value / 100.0;
        }
        return value;
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private ValidatedIncentive validate(IncentiveSaveRequest request) {
        if (request == null) {
            throw new RuntimeException("Invalid incentive");
        }
        String shopId = request.getShopId() == null ? "" : request.getShopId().trim();
        if (shopId.isBlank()) {
            throw new RuntimeException("Select shop");
        }
        if (request.getUserId() == null || request.getUserId() <= 0) {
            throw new RuntimeException("Select user");
        }
        if (request.getTargetAmount() == null || request.getTargetAmount() <= 0) {
            throw new RuntimeException("Enter a valid target amount");
        }
        String compare = request.getCompareType() == null ? "" : request.getCompareType().trim().toLowerCase();
        if (!COMPARE.contains(compare)) {
            throw new RuntimeException("Select less than or greater than");
        }
        String mode = request.getIncentiveMode() == null ? "" : request.getIncentiveMode().trim().toLowerCase();
        if (!MODES.contains(mode)) {
            throw new RuntimeException("Select amount or percent");
        }
        if (request.getIncentiveValue() == null || request.getIncentiveValue() <= 0) {
            throw new RuntimeException("Enter a valid incentive value");
        }
        if ("percent".equals(mode) && request.getIncentiveValue() > 100) {
            throw new RuntimeException("Percent cannot be more than 100");
        }
        return new ValidatedIncentive(shopId, request.getUserId(), request.getTargetAmount(), compare, mode, request.getIncentiveValue());
    }

    private IncentiveRow mapRow(ResultSet rs) throws SQLException {
        IncentiveRow row = new IncentiveRow();
        long id = rs.getLong("id");
        row.setId(rs.wasNull() ? null : id);
        row.setShopId(rs.getString("shopId"));
        row.setShopName(rs.getString("shopName"));
        row.setUserId(rs.getLong("userId"));
        row.setUserName(rs.getString("userName"));
        double target = rs.getDouble("targetAmount");
        row.setTargetAmount(rs.wasNull() ? null : target);
        row.setCompareType(rs.getString("compareType"));
        row.setIncentiveMode(rs.getString("incentiveMode"));
        double value = rs.getDouble("incentiveValue");
        row.setIncentiveValue(rs.wasNull() ? null : value);
        return row;
    }

    private record ValidatedIncentive(
            String shopId,
            Long userId,
            Double targetAmount,
            String compare,
            String mode,
            Double incentiveValue
    ) {
    }
}
