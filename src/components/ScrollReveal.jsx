import { motion, useInView, useAnimation } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

// 检测移动端的 Hook
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return isMobile
}

// 简化的滚动动画变体（性能优化）
const techVariants = {
  // 简单的淡入
  fade: {
    hidden: { 
      opacity: 0,
    },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.4,
        ease: "easeOut",
      }
    }
  },
  
  // 从下方滑入（简化版）
  slideUp: {
    hidden: { 
      opacity: 0, 
      y: 30,
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4,
        ease: "easeOut",
      }
    }
  },
  
  // 淡入 + 轻微缩放
  fadeScale: {
    hidden: { 
      opacity: 0, 
      scale: 0.95,
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.4,
        ease: "easeOut",
      }
    }
  },
  
  // 从左侧滑入（简化版）
  slideLeft: {
    hidden: { 
      opacity: 0, 
      x: -30,
    },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        duration: 0.4,
        ease: "easeOut",
      }
    }
  },
  
  // 从右侧滑入（简化版）
  slideRight: {
    hidden: { 
      opacity: 0, 
      x: 30,
    },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        duration: 0.4,
        ease: "easeOut",
      }
    }
  },
  
  // 兼容旧版本的变体名称（映射到简化版本）
  flip3D: {
    hidden: { 
      opacity: 0, 
      scale: 0.95,
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.4,
        ease: "easeOut",
      }
    }
  },
  
  slideUpGlow: {
    hidden: { 
      opacity: 0, 
      y: 30,
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4,
        ease: "easeOut",
      }
    }
  },
  
  scaleRotate: {
    hidden: { 
      opacity: 0, 
      scale: 0.95,
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.4,
        ease: "easeOut",
      }
    }
  },
  
  tilt3D: {
    hidden: { 
      opacity: 0, 
      scale: 0.95,
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.4,
        ease: "easeOut",
      }
    }
  },
  
  countUp: {
    hidden: { 
      opacity: 0, 
      y: 20,
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4,
        ease: "easeOut",
      }
    }
  },
  
  lightWave: {
    hidden: { 
      opacity: 0,
    },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.4,
        ease: "easeOut",
      }
    }
  },
}

// 主滚动动画组件
export default function ScrollReveal({ 
  children, 
  variant = 'fadeScale',
  delay = 0,
  className = '',
  once = true,
  amount = 0.3,
}) {
  const ref = useRef(null)
  const isMobile = useIsMobile()
  const isInView = useInView(ref, { 
    once, 
    amount: isMobile ? 0.1 : amount,
    margin: isMobile ? "0px 0px -50px 0px" : "0px 0px -100px 0px"
  })
  const controls = useAnimation()

  useEffect(() => {
    if (isInView) {
      controls.start('visible')
    } else if (!once) {
      controls.start('hidden')
    }
  }, [isInView, controls, once])

  const selectedVariant = techVariants[variant] || techVariants.fadeScale

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={selectedVariant}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// 子元素动画（用于网格布局）
export function ScrollRevealItem({ 
  children, 
  variant = 'fadeScale',
  delay = 0,
  className = '',
}) {
  const isMobile = useIsMobile()
  const viewportAmount = isMobile ? 0.1 : 0.2

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: viewportAmount }}
      variants={techVariants[variant] || techVariants.fadeScale}
      transition={{ delay: Math.min(delay, 0.2) }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// 数字滚动动画组件
export function CountUp({ 
  end, 
  duration = 2,
  suffix = '',
  className = '',
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (isInView) {
      let startTime = null
      const animate = (currentTime) => {
        if (startTime === null) startTime = currentTime
        const progress = Math.min((currentTime - startTime) / (duration * 1000), 1)
        const easeOutQuart = 1 - Math.pow(1 - progress, 4)
        setCount(Math.floor(easeOutQuart * end))
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      requestAnimationFrame(animate)
    }
  }, [isInView, end, duration])

  return (
    <motion.span
      ref={ref}
      variants={techVariants.countUp}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={className}
    >
      {count}{suffix}
    </motion.span>
  )
}

