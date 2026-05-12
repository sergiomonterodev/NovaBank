import { beforeEach, describe, expect, it, vi } from "vitest";

const mockStore = {
  user: {
    id: 1,
    balance: 100,
    accountNumber: "ACC123456",
  },
  addMovement: vi.fn(),
  addNotification: vi.fn(),
};

vi.mock("../store.js", () => ({
  store: mockStore,
}));

await import("./transferir-form.js");

const createForm = async () => {
  document.body.innerHTML = "";
  const el = document.createElement("transferir-form");
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
};

const fillCommonFields = (form, values = {}) => {
  form.querySelector('input[name="targetAccountNumber"]').value =
    values.targetAccountNumber ?? "acc654321";
  form.querySelector('input[name="concept"]').value = values.concept ?? "Prueba";
  form.querySelector('input[name="amount"]').value = String(values.amount ?? 10);
};

const submitWithTarget = async (el, form) => {
  await el._handleSubmit({
    preventDefault: vi.fn(),
    target: form,
  });
};

describe("TransferirForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.user = {
      id: 1,
      balance: 100,
      accountNumber: "ACC123456",
    };
    mockStore.addMovement.mockResolvedValue(true);
  });

  it("procesa transferencia normal y llama addMovement", async () => {
    const el = await createForm();
    const form = el.shadowRoot.querySelector("form");

    fillCommonFields(form);

    await submitWithTarget(el, form);

    expect(mockStore.addMovement).toHaveBeenCalledTimes(1);
    const payload = mockStore.addMovement.mock.calls[0][0];
    expect(payload.transferType).toBe("normal");
    expect(payload.targetAccountNumber).toBe("ACC654321");
    expect(payload.date).toContain("T");
  });

  it("tipo hora exacta valida y notifica sin crear movimiento inmediato", async () => {
    const el = await createForm();
    el._transferType = "hora";
    await el.updateComplete;

    const form = el.shadowRoot.querySelector("form");
    fillCommonFields(form);
    form.querySelector('input[name="scheduleHour"]').value = "14";
    form.querySelector('select[name="timezone"]').value = "1";

    await submitWithTarget(el, form);

    expect(mockStore.addMovement).not.toHaveBeenCalled();
    expect(mockStore.addNotification).toHaveBeenCalledWith(
      expect.stringContaining("Transferencia programada a las 14:00 h"),
      "success"
    );
  });

  it("tipo calendario exige dias seleccionados y luego permite programar", async () => {
    const el = await createForm();
    el._transferType = "calendario";
    await el.updateComplete;

    const form = el.shadowRoot.querySelector("form");
    fillCommonFields(form);

    await submitWithTarget(el, form);

    expect(mockStore.addNotification).toHaveBeenCalledWith(
      expect.stringContaining("Selecciona al menos"),
      "error"
    );

    vi.clearAllMocks();
    el._selectedDays = ["2026-05-18"];
    await submitWithTarget(el, form);

    expect(mockStore.addMovement).not.toHaveBeenCalled();
    expect(mockStore.addNotification).toHaveBeenCalledWith(
      expect.stringContaining("Transferencia programada para 1"),
      "success"
    );
  });

  it("tipo periodicidad valida input numerico y programa", async () => {
    const el = await createForm();
    el._transferType = "periodicidad";
    await el.updateComplete;

    const form = el.shadowRoot.querySelector("form");
    fillCommonFields(form);

    form.querySelector('input[name="periodicidad"]').value = "0";
    form.querySelector('select[name="periodicidadUnit"]').value = "meses";

    await submitWithTarget(el, form);

    expect(mockStore.addNotification).toHaveBeenCalledWith(
      expect.stringContaining("Introduce una periodicidad"),
      "error"
    );

    vi.clearAllMocks();
    form.querySelector('input[name="periodicidad"]').value = "2";
    await submitWithTarget(el, form);

    expect(mockStore.addMovement).not.toHaveBeenCalled();
    expect(mockStore.addNotification).toHaveBeenCalledWith(
      "Transferencia programada cada 2 meses",
      "success"
    );
  });
});
