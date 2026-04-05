"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, MapPin, Loader2 } from 'lucide-react'
import AddressPicker, { AddressOption } from '../AddressPicker'
import { CartItem, PaymentMethod, Product, StoreTheme, PAYMENT_OPTIONS } from '../MenuComponent'

export type CheckoutModalProps = {
  isOpen: boolean
  onClose: () => void

  cart: CartItem[]
  cartTotal: number
  orderTotal: number

  deliveryFee: number | null
  deliveryFeeError: string | null
  isCalculatingFee: boolean
  isFeeEstimated: boolean

  upsellProducts: Product[]
  onUpsellClick: (product: Product) => void

  userAddresses: AddressOption[]
  selectedAddressId: string | null
  onSelectAddress: (id: string) => void
  loadingAddresses: boolean
  onOpenLoginForAddress: () => void

  paymentMethod: PaymentMethod
  onPaymentMethodChange: (method: PaymentMethod) => void

  changeFor: string
  onChangeForChange: (value: string) => void
  changeForError: boolean

  checkoutError: string
  isProcessing: boolean
  onConfirmOrder: () => void

  storeTheme: StoreTheme
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cart,
  cartTotal,
  orderTotal,
  deliveryFee,
  deliveryFeeError,
  isCalculatingFee,
  isFeeEstimated,
  upsellProducts,
  onUpsellClick,
  userAddresses,
  selectedAddressId,
  onSelectAddress,
  loadingAddresses,
  onOpenLoginForAddress,
  paymentMethod,
  onPaymentMethodChange,
  changeFor,
  onChangeForChange,
  changeForError,
  checkoutError,
  isProcessing,
  onConfirmOrder,
  storeTheme,
}: CheckoutModalProps) {
  const { brandColor, phoneBg, phoneCard, phoneText, phoneSubText } = storeTheme

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md rounded-t-[28px] border-t shadow-2xl flex flex-col max-h-[92vh]"
            style={{ background: phoneBg, borderColor: phoneSubText + '22' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: phoneSubText + '44' }} />
            </div>

            <div className="px-5 py-3 flex justify-between items-center border-b" style={{ borderColor: phoneSubText + '22' }}>
              <h3 className="text-xl font-black uppercase tracking-tight" style={{ color: phoneText }}>Seu Pedido</h3>
              <button
                onClick={onClose}
                className="w-11 h-11 flex items-center justify-center rounded-full transition-colors"
                style={{ background: phoneSubText + '22', color: phoneSubText }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-5 pb-6">

              {/* Resumo dos itens */}
              <div className="rounded-2xl p-4 border" style={{ background: phoneCard, borderColor: phoneSubText + '22' }}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: phoneSubText }}>Itens</p>
                <div className="space-y-2">
                  {cart.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-bold block truncate leading-tight mb-0.5" style={{ color: phoneText }}>{item.product.name}</span>
                        {item.optionsText && <span className="text-[11px] block pr-4 leading-snug" style={{ color: phoneSubText }}>{item.optionsText}</span>}
                      </div>
                      <span className="font-black whitespace-nowrap pt-0.5" style={{ color: brandColor }}>R$ {(item.displayPrice * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Subtotal + frete */}
                <div className="border-t mt-3 pt-3 space-y-2" style={{ borderColor: phoneSubText + '22' }}>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold" style={{ color: phoneSubText }}>Subtotal</span>
                    <span className="font-black" style={{ color: phoneText }}>R$ {cartTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold flex items-center gap-1.5" style={{ color: phoneSubText }}>
                      <MapPin className="w-3.5 h-3.5" /> Entrega
                    </span>
                    {isCalculatingFee ? (
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: phoneSubText }} />
                    ) : deliveryFeeError ? (
                      <span className="text-red-500 font-black text-xs">{deliveryFeeError}</span>
                    ) : deliveryFee !== null ? (
                      <span className="font-black" style={{ color: deliveryFee === 0 ? '#22c55e' : phoneText }}>
                        {deliveryFee === 0 ? 'Grátis 🎁' : `R$ ${deliveryFee.toFixed(2)}`}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: phoneSubText }}>Selecione um endereço</span>
                    )}
                  </div>

                  {/* BUG-009: aviso de frete estimado quando Mapbox Directions falhou */}
                  {isFeeEstimated && deliveryFee !== null && (
                    <p className="text-[10px] font-bold" style={{ color: phoneSubText }}>
                      * Frete estimado — valor exato confirmado após o pedido.
                    </p>
                  )}

                  <div className="flex justify-between items-center pt-1 border-t" style={{ borderColor: phoneSubText + '22' }}>
                    <span className="font-black text-sm" style={{ color: phoneText }}>TOTAL</span>
                    <span className="font-black text-2xl" style={{ color: brandColor }}>
                      R$ {orderTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Upsell Carousel */}
              {upsellProducts.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: phoneSubText }}>
                    Aproveite e leve também
                  </p>
                  <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 -mx-1 px-1">
                    {upsellProducts.map(product => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => onUpsellClick(product)}
                        className="min-w-[130px] flex-shrink-0 rounded-2xl border p-2.5 text-left transition-transform active:scale-95"
                        style={{ background: phoneCard, borderColor: phoneSubText + '22' }}
                      >
                        <div
                          className="h-16 w-full rounded-xl overflow-hidden flex items-center justify-center"
                          style={{ background: brandColor + '15' }}
                        >
                          {product.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-2xl select-none" style={{ opacity: 0.3 }}>🍽️</span>
                          )}
                        </div>
                        <p className="text-xs font-bold mt-2 line-clamp-1 leading-tight" style={{ color: phoneText }}>
                          {product.name}
                        </p>
                        <div className="flex items-center justify-between mt-1.5 gap-1">
                          <span className="text-xs font-black" style={{ color: brandColor }}>
                            R$ {product.price.toFixed(2)}
                          </span>
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: brandColor }}
                          >
                            <Plus className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Endereço */}
              {loadingAddresses ? (
                <div className="flex items-center gap-3 py-4" style={{ color: phoneSubText }}>
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: brandColor }} />
                  <span className="text-sm font-medium">Carregando endereços...</span>
                </div>
              ) : userAddresses.length > 0 ? (
                <AddressPicker
                  addresses={userAddresses}
                  selectedId={selectedAddressId}
                  onSelect={onSelectAddress}
                  onAddNew={onOpenLoginForAddress}
                  brandColor={brandColor}
                  phoneBg={phoneBg}
                  phoneCard={phoneCard}
                  phoneText={phoneText}
                  phoneSubText={phoneSubText}
                />
              ) : (
                <div className="rounded-2xl p-4 flex items-center gap-3 border" style={{ background: brandColor + '10', borderColor: brandColor + '33' }}>
                  <MapPin className="w-5 h-5 shrink-0" style={{ color: brandColor }} />
                  <div>
                    <p className="font-bold text-sm" style={{ color: phoneText }}>Nenhum endereço cadastrado</p>
                    <button
                      type="button"
                      onClick={onOpenLoginForAddress}
                      className="text-xs underline mt-0.5"
                      style={{ color: brandColor }}
                    >
                      Cadastrar agora →
                    </button>
                  </div>
                </div>
              )}

              {/* Pagamento */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: phoneSubText }}>Forma de Pagamento</p>
                <div className="grid grid-cols-2 gap-3">
                  {PAYMENT_OPTIONS.map(opt => {
                    const isSelected = paymentMethod === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onPaymentMethodChange(opt.id)}
                        className="flex flex-col items-center justify-center gap-1.5 py-4 px-2 rounded-2xl border-2 transition-all font-black text-xs uppercase min-h-[80px]"
                        style={isSelected
                          ? { borderColor: brandColor, background: brandColor + '18', color: brandColor }
                          : { borderColor: phoneSubText + '33', background: phoneCard, color: phoneSubText }
                        }
                      >
                        {opt.icon}
                        <span>{opt.label}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: phoneSubText }}>{opt.desc}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Troco */}
              <AnimatePresence>
                {paymentMethod === 'CASH' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <label className="text-[10px] font-black uppercase tracking-widest mb-2 block" style={{ color: phoneSubText }}>
                      Troco para quanto? <span className="normal-case font-medium">(opcional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-sm" style={{ color: phoneSubText }}>R$</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={orderTotal}
                        step="0.01"
                        value={changeFor}
                        onChange={e => onChangeForChange(e.target.value)}
                        placeholder={`Mínimo R$ ${orderTotal.toFixed(2)}`}
                        className="w-full pl-12 min-h-[52px] rounded-xl border-2 px-4 py-3 text-base font-medium outline-none transition-colors"
                        style={{
                          background: phoneCard,
                          color: phoneText,
                          borderColor: changeForError ? '#ef4444' : phoneSubText + '33',
                          caretColor: brandColor,
                        }}
                      />
                    </div>
                    {changeForError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-xs font-bold mt-1.5"
                      >
                        Valor mínimo para troco: R$ {orderTotal.toFixed(2)}
                      </motion.p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {checkoutError && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm font-bold text-center bg-red-50 border border-red-200 p-3 rounded-xl">
                  {checkoutError}
                </motion.p>
              )}
            </div>

            {/* CTA */}
            <div className="px-5 pt-4 border-t" style={{ borderColor: phoneSubText + '22', paddingBottom: 'max(env(safe-area-inset-bottom, 24px), 24px)' }}>
              <button
                onClick={onConfirmOrder}
                disabled={isProcessing || userAddresses.length === 0 || !!deliveryFeeError || isCalculatingFee || changeForError}
                className="w-full flex items-center justify-center gap-2 text-white font-black text-base uppercase px-6 py-4 rounded-xl active:scale-[0.98] transition-all shadow-lg min-h-[56px] disabled:opacity-50"
                style={{ backgroundColor: brandColor }}
              >
                {isProcessing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> PROCESSANDO...</>
                ) : (
                  `Finalizar Pedido — R$ ${orderTotal.toFixed(2)}`
                )}
              </button>
              {userAddresses.length === 0 && (
                <p className="text-center text-xs mt-2" style={{ color: phoneSubText }}>Cadastre um endereço para continuar</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
