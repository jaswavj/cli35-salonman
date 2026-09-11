package com.billing.incentive;

import com.billing.core.response.ResponseDO;
import com.billing.data.AppUser;
import com.billing.incentive.dto.IncentiveSaveRequest;
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
@RequestMapping("/api/v1/incentives")
public class IncentiveController {

    private final IncentiveService incentiveService;
    private final PlatformSecurityContext securityContext;

    @GetMapping
    public ResponseDO get(@RequestParam String shopId, @RequestParam Long userId) {
        return ok(incentiveService.listByUser(shopId, userId));
    }

    @GetMapping("/list")
    public ResponseDO list(@RequestParam String shopId) {
        return ok(incentiveService.listByShop(shopId));
    }

    @GetMapping("/today")
    public ResponseDO today() {
        return ok(incentiveService.today(currentUser()));
    }

    @GetMapping("/report")
    public ResponseDO report(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(required = false) String shopId,
            @RequestParam(required = false) Long userId
    ) {
        return ok(incentiveService.report(from, to, shopId, userId));
    }

    @PostMapping
    public ResponseDO save(@RequestBody IncentiveSaveRequest request) {
        return ok(incentiveService.save(request));
    }

    @PostMapping("/{id}/delete")
    public ResponseDO delete(@PathVariable Long id) {
        incentiveService.delete(id);
        return ok(true);
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
