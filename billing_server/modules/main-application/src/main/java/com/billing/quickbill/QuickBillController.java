package com.billing.quickbill;

import com.billing.core.response.ResponseDO;
import com.billing.data.AppUser;
import com.billing.quickbill.dto.QuickBillCancelRequest;
import com.billing.quickbill.dto.QuickBillSaveRequest;
import com.billing.security.PlatformSecurityContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/quick-bills")
public class QuickBillController {

    private final QuickBillService quickBillService;
    private final PlatformSecurityContext securityContext;

    @PostMapping
    public ResponseDO save(@RequestBody QuickBillSaveRequest request) {
        return ok(quickBillService.save(request, currentUser()));
    }

    @GetMapping("/today")
    public ResponseDO today() {
        return ok(quickBillService.today(currentUser()));
    }

    @GetMapping("/trend")
    public ResponseDO trend(
            @RequestParam(defaultValue = "10") int days,
            @RequestParam(required = false) Boolean mine,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String shopId
    ) {
        if (Boolean.TRUE.equals(mine)) {
            return ok(quickBillService.myTrend(currentUser(), days));
        }
        return ok(quickBillService.trend(days, userId, shopId));
    }

    @GetMapping("/report")
    public ResponseDO report(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String shopId
    ) {
        return ok(quickBillService.report(from, to, userId, shopId));
    }

    @GetMapping("/accounts/today")
    public ResponseDO todayAccounts() {
        return ok(quickBillService.todayAccounts(currentUser()));
    }

    @GetMapping("/accounts")
    public ResponseDO accounts(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam String shopId
    ) {
        return ok(quickBillService.accounts(from, to, shopId));
    }

    @PostMapping("/{id}")
    public ResponseDO update(@PathVariable Long id, @RequestBody QuickBillSaveRequest request) {
        quickBillService.update(id, request, currentUser());
        return ok(true);
    }

    @PostMapping("/{id}/cancel")
    public ResponseDO cancel(@PathVariable Long id, @RequestBody QuickBillCancelRequest request) {
        quickBillService.cancel(id, request, currentUser());
        return ok(true);
    }

    @GetMapping("/logs")
    public ResponseDO logs(@RequestParam String from, @RequestParam String to) {
        return ok(quickBillService.logs(from, to));
    }

    private AppUser currentUser() {
        return securityContext.authenticateUser();
    }

    private ResponseDO ok(Object data) {
        ResponseDO response = new ResponseDO();
        response.setSuccess(true);
        response.setData(data);
        return response;
    }
}
